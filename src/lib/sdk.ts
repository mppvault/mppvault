/**
 * MPP Vault SDK
 *
 * Minimal TypeScript SDK for agent-to-agent payments through MPP Vault.
 * Agents use this to execute payments from their sub-account.
 *
 * Usage:
 *   const vault = new MppVaultSDK({ connection, programId, agentKeypair });
 *   await vault.pay(subAccountAddress, recipientAddress, amount);
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

function encodeU64(value: bigint): Buffer {
  const buf = new Uint8Array(8);
  let v = value;
  for (let i = 0; i < 8; i++) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return Buffer.from(buf);
}

function decodeU64(buf: Buffer | Uint8Array, offset: number): bigint {
  let result = 0n;
  for (let i = 7; i >= 0; i--) {
    result = (result << 8n) | BigInt(buf[offset + i]);
  }
  return result;
}

function readString(buf: Buffer | Uint8Array, offset: number): [string, number] {
  const len = buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24);
  const str = Buffer.from(buf.slice(offset + 4, offset + 4 + len)).toString("utf-8");
  return [str, offset + 4 + len];
}

async function anchorDiscriminator(name: string): Promise<Buffer> {
  const data = new TextEncoder().encode(`global:${name}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(data));
  return Buffer.from(new Uint8Array(hashBuffer).slice(0, 8));
}

function findATA(owner: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export interface MppVaultConfig {
  connection: Connection;
  programId: PublicKey | string;
  agentKeypair: Keypair;
}

export interface SubAccountInfo {
  vault: string;
  name: string;
  agentId: string;
  balance: number;
  totalBudget: number;
  spent: number;
  status: "active" | "paused" | "closed";
  maxPerTx: number;
  maxPerDay: number;
  spentToday: number;
  txCount: number;
}

export interface PaymentResult {
  signature: string;
  amount: number;
  recipient: string;
}

export class MppVaultSDK {
  readonly connection: Connection;
  readonly programId: PublicKey;
  readonly agent: Keypair;

  constructor(config: MppVaultConfig) {
    this.connection = config.connection;
    this.programId = typeof config.programId === "string"
      ? new PublicKey(config.programId)
      : config.programId;
    this.agent = config.agentKeypair;
  }

  /**
   * Execute a USDC payment from a sub-account to a whitelisted recipient.
   * The agent must be the signer. The recipient must be whitelisted.
   */
  async pay(
    subAccountAddress: string | PublicKey,
    recipientAddress: string | PublicKey,
    amountUsdc: number,
  ): Promise<PaymentResult> {
    const subAccount = new PublicKey(subAccountAddress);
    const recipient = new PublicKey(recipientAddress);
    const amountLamports = BigInt(Math.round(amountUsdc * 1e6));

    const subInfo = await this.connection.getAccountInfo(subAccount);
    if (!subInfo) throw new Error("Sub-account not found on-chain");

    let offset = 8;
    const vaultPubkey = new PublicKey(subInfo.data.slice(offset, offset + 32));

    const vaultInfo = await this.connection.getAccountInfo(vaultPubkey);
    if (!vaultInfo) throw new Error("Vault not found on-chain");

    const whitelistPDA = PublicKey.findProgramAddressSync(
      [Buffer.from("whitelist"), subAccount.toBuffer(), recipient.toBuffer()],
      this.programId,
    )[0];

    const vaultTokenAccount = findATA(vaultPubkey, USDC_MINT);
    const recipientTokenAccount = findATA(recipient, USDC_MINT);

    const data = Buffer.concat([
      await anchorDiscriminator("execute_payment"),
      encodeU64(amountLamports),
    ]);

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: this.agent.publicKey, isSigner: true, isWritable: false },
        { pubkey: vaultPubkey, isSigner: false, isWritable: false },
        { pubkey: subAccount, isSigner: false, isWritable: true },
        { pubkey: whitelistPDA, isSigner: false, isWritable: false },
        { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
        { pubkey: recipient, isSigner: false, isWritable: true },
        { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data,
    });

    const tx = new Transaction().add(ix);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      tx,
      [this.agent],
      { commitment: "confirmed" },
    );

    return {
      signature,
      amount: amountUsdc,
      recipient: recipient.toBase58(),
    };
  }

  /**
   * Read sub-account info from chain.
   */
  async getSubAccount(subAccountAddress: string | PublicKey): Promise<SubAccountInfo> {
    const pubkey = new PublicKey(subAccountAddress);
    const info = await this.connection.getAccountInfo(pubkey);
    if (!info) throw new Error("Sub-account not found");

    let offset = 8;
    const vault = new PublicKey(info.data.slice(offset, offset + 32)).toBase58();
    offset += 32;
    const [name, off2] = readString(info.data, offset); offset = off2;
    const [agentId, off3] = readString(info.data, offset); offset = off3;
    const balance = decodeU64(info.data, offset); offset += 8;
    const totalBudget = decodeU64(info.data, offset); offset += 8;
    const spent = decodeU64(info.data, offset); offset += 8;
    const statusByte = info.data[offset]; offset += 1;
    const maxPerTx = decodeU64(info.data, offset); offset += 8;
    const maxPerDay = decodeU64(info.data, offset); offset += 8;
    const spentToday = decodeU64(info.data, offset); offset += 8;
    offset += 8; // lastDayReset
    offset += 4 + 4 + 1 + 1; // timeWindow fields
    offset += 8 + 8; // autoTopup fields
    const txCount = decodeU64(info.data, offset);

    const U64_MAX = 18446744073709551615n;
    const toUsdc = (v: bigint) => v >= U64_MAX - 1000n ? -1 : Number(v) / 1e6;
    const statusMap = ["active", "paused", "closed"] as const;

    return {
      vault,
      name,
      agentId,
      balance: toUsdc(balance),
      totalBudget: toUsdc(totalBudget),
      spent: toUsdc(spent),
      status: statusMap[statusByte] ?? "closed",
      maxPerTx: toUsdc(maxPerTx),
      maxPerDay: toUsdc(maxPerDay),
      spentToday: toUsdc(spentToday),
      txCount: Number(txCount),
    };
  }

  /**
   * Check if the agent can make a payment of the given amount.
   */
  async canPay(subAccountAddress: string | PublicKey, amountUsdc: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const sub = await this.getSubAccount(subAccountAddress);

    if (sub.status !== "active") return { allowed: false, reason: "Sub-account is not active" };
    if (sub.balance < amountUsdc) return { allowed: false, reason: `Insufficient balance: ${sub.balance} USDC` };
    if (sub.maxPerTx >= 0 && amountUsdc > sub.maxPerTx) return { allowed: false, reason: `Exceeds per-tx limit: ${sub.maxPerTx} USDC` };
    if (sub.maxPerDay >= 0 && sub.spentToday + amountUsdc > sub.maxPerDay) return { allowed: false, reason: `Exceeds daily limit: ${sub.maxPerDay} USDC` };

    return { allowed: true };
  }
}
