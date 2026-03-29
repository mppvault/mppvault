import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);
const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);

const DEFAULT_PROGRAM_ID = "2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx";

// ── encoding helpers ──────────────────────────────

function encodeU64(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  let v = value;
  for (let i = 0; i < 8; i++) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}

function decodeU64(buf: Buffer | Uint8Array, offset: number): bigint {
  let result = 0n;
  for (let i = 7; i >= 0; i--) {
    result = (result << 8n) | BigInt(buf[offset + i]);
  }
  return result;
}

function readString(
  buf: Buffer | Uint8Array,
  offset: number,
): [string, number] {
  const len =
    buf[offset] |
    (buf[offset + 1] << 8) |
    (buf[offset + 2] << 16) |
    (buf[offset + 3] << 24);
  const str = Buffer.from(buf.slice(offset + 4, offset + 4 + len)).toString(
    "utf-8",
  );
  return [str, offset + 4 + len];
}

async function anchorDiscriminator(name: string): Promise<Buffer> {
  const data = new TextEncoder().encode(`global:${name}`);
  const hashBuffer = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(data),
  );
  return Buffer.from(new Uint8Array(hashBuffer).slice(0, 8));
}

function findATA(owner: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

// ── types ─────────────────────────────────────────

export interface MppVaultConfig {
  /** Solana RPC connection */
  connection: Connection;
  /** MPP Vault program ID (defaults to mainnet deployment) */
  programId?: PublicKey | string;
  /** Agent keypair used to sign payment transactions */
  agentKeypair: Keypair;
  /** Base URL for the MPP Vault catalog API (defaults to https://mppvault.com) */
  catalogApiUrl?: string;
}

export interface SubAccountInfo {
  /** Vault PDA this sub-account belongs to */
  vault: string;
  /** Human-readable name */
  name: string;
  /** Agent identifier */
  agentId: string;
  /** Current USDC balance */
  balance: number;
  /** Total budget allocation in USDC */
  totalBudget: number;
  /** Total USDC spent all-time */
  spent: number;
  /** Account status */
  status: "active" | "paused" | "closed";
  /** Max USDC per transaction (-1 = unlimited) */
  maxPerTx: number;
  /** Max USDC per day (-1 = unlimited) */
  maxPerDay: number;
  /** USDC spent today (resets daily) */
  spentToday: number;
  /** Total transaction count */
  txCount: number;
}

export interface PaymentResult {
  /** Transaction signature */
  signature: string;
  /** Amount paid in USDC */
  amount: number;
  /** Recipient wallet address */
  recipient: string;
}

export interface PaymentCheck {
  /** Whether the payment would succeed */
  allowed: boolean;
  /** Reason if not allowed */
  reason?: string;
}

export interface RateCard {
  /** Capability name */
  capability: string;
  /** Price in USDC per invocation */
  priceUsdc: number;
  /** Pricing unit (e.g. "per-call", "per-1k-tokens") */
  unit: string;
}

export interface AgentCatalogEntry {
  /** Sub-account address of the agent */
  subAccountAddress: string;
  /** Human-readable agent name */
  agentName: string;
  /** Agent identifier */
  agentId: string;
  /** Description of the agent's services */
  description: string;
  /** API endpoint URL */
  endpoint: string;
  /** List of capabilities offered */
  capabilities: string[];
  /** Pricing for each capability */
  rateCards: RateCard[];
  /** Service level agreement */
  sla: { uptimePercent: number; avgResponseMs: number; maxResponseMs: number };
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  /** Transaction signature */
  signature: string;
  /** Sub-account address */
  subAccountAddress: string;
  /** Capability invoked */
  capability: string;
  /** Amount paid in USDC */
  amountUsdc: number;
  /** Recipient address */
  recipient: string;
  /** ISO timestamp */
  timestamp: string;
}

export interface ServicePaymentResult extends PaymentResult {
  /** The capability that was paid for */
  capability: string;
  /** The rate card price used */
  priceUsdc: number;
}

// ── SDK ───────────────────────────────────────────

export class MppVaultSDK {
  readonly connection: Connection;
  readonly programId: PublicKey;
  readonly agent: Keypair;
  readonly catalogApiUrl: string;

  private usageLog: UsageRecord[] = [];

  constructor(config: MppVaultConfig) {
    this.connection = config.connection;
    this.programId =
      config.programId == null
        ? new PublicKey(DEFAULT_PROGRAM_ID)
        : typeof config.programId === "string"
          ? new PublicKey(config.programId)
          : config.programId;
    this.agent = config.agentKeypair;
    this.catalogApiUrl = config.catalogApiUrl || "https://mppvault.com";
  }

  /**
   * Execute a USDC payment from a sub-account to a whitelisted recipient.
   *
   * The agent keypair is used as the signer. The recipient must be
   * whitelisted on the sub-account or the transaction will be rejected.
   *
   * @param subAccountAddress - The sub-account PDA address
   * @param recipientAddress  - The whitelisted recipient wallet
   * @param amountUsdc        - Amount in USDC (e.g. 5.00 = five dollars)
   * @returns Transaction signature and payment details
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

    const vaultPubkey = new PublicKey(subInfo.data.slice(8, 40));

    const whitelistPDA = PublicKey.findProgramAddressSync(
      [
        Buffer.from("whitelist"),
        subAccount.toBuffer(),
        recipient.toBuffer(),
      ],
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
   * Read sub-account data from on-chain state.
   *
   * @param subAccountAddress - The sub-account PDA address
   * @returns Parsed sub-account info including balance, rules, and stats
   */
  async getSubAccount(
    subAccountAddress: string | PublicKey,
  ): Promise<SubAccountInfo> {
    const pubkey = new PublicKey(subAccountAddress);
    const info = await this.connection.getAccountInfo(pubkey);
    if (!info) throw new Error("Sub-account not found");

    const d = info.data;
    let offset = 8;
    const vault = new PublicKey(d.slice(offset, offset + 32)).toBase58();
    offset += 32;
    const [name, off2] = readString(d, offset);
    offset = off2;
    const [agentId, off3] = readString(d, offset);
    offset = off3;
    const balance = decodeU64(d, offset);
    offset += 8;
    const totalBudget = decodeU64(d, offset);
    offset += 8;
    const spent = decodeU64(d, offset);
    offset += 8;
    const statusByte = d[offset];
    offset += 1;
    const maxPerTx = decodeU64(d, offset);
    offset += 8;
    const maxPerDay = decodeU64(d, offset);
    offset += 8;
    const spentToday = decodeU64(d, offset);
    offset += 8;
    offset += 8; // lastDayReset
    offset += 4 + 4 + 1 + 1; // timeWindow fields
    offset += 8 + 8; // autoTopup fields
    const txCount = decodeU64(d, offset);

    const U64_MAX = 18446744073709551615n;
    const toUsdc = (v: bigint) =>
      v >= U64_MAX - 1000n ? -1 : Number(v) / 1e6;
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
   * Pre-check whether a payment of the given amount would succeed.
   *
   * Checks sub-account status, balance, per-tx limit, and daily limit.
   * Does NOT check whitelist (that requires an on-chain lookup).
   *
   * @param subAccountAddress - The sub-account PDA address
   * @param amountUsdc        - Amount in USDC to check
   * @returns Whether the payment is allowed, with reason if not
   */
  async canPay(
    subAccountAddress: string | PublicKey,
    amountUsdc: number,
  ): Promise<PaymentCheck> {
    const sub = await this.getSubAccount(subAccountAddress);

    if (sub.status !== "active")
      return { allowed: false, reason: "Sub-account is not active" };
    if (sub.balance < amountUsdc)
      return {
        allowed: false,
        reason: `Insufficient balance: ${sub.balance} USDC`,
      };
    if (sub.maxPerTx >= 0 && amountUsdc > sub.maxPerTx)
      return {
        allowed: false,
        reason: `Exceeds per-tx limit: ${sub.maxPerTx} USDC`,
      };
    if (
      sub.maxPerDay >= 0 &&
      sub.spentToday + amountUsdc > sub.maxPerDay
    )
      return {
        allowed: false,
        reason: `Exceeds daily limit: ${sub.maxPerDay} USDC`,
      };

    return { allowed: true };
  }

  /**
   * Discover agents that offer a specific capability.
   *
   * Queries the MPP Vault catalog API to find agents
   * registered with the given capability.
   *
   * @param capability - The capability to search for (e.g. "text-generation")
   * @returns List of agents offering that capability
   */
  async discoverAgents(capability: string): Promise<AgentCatalogEntry[]> {
    const url = `${this.catalogApiUrl}/api/catalog?capability=${encodeURIComponent(capability)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Catalog API error: ${res.status}`);
    return res.json();
  }

  /**
   * Get the full catalog entry for a specific agent.
   *
   * @param subAccountAddress - The agent's sub-account address
   * @returns The agent's catalog entry with capabilities, rate cards, and SLA
   */
  async getAgentCatalog(
    subAccountAddress: string,
  ): Promise<AgentCatalogEntry | null> {
    const url = `${this.catalogApiUrl}/api/catalog?address=${encodeURIComponent(subAccountAddress)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Catalog API error: ${res.status}`);
    const entries: AgentCatalogEntry[] = await res.json();
    return entries[0] ?? null;
  }

  /**
   * Pay an agent for a specific capability at its advertised rate.
   *
   * Looks up the agent's rate card, verifies the capability exists,
   * and executes the payment at the listed price.
   *
   * @param subAccountAddress - Your sub-account (the payer)
   * @param agentAddress      - The agent to pay (recipient's sub-account)
   * @param capability        - The capability to pay for
   * @returns Payment result including the capability and price
   */
  async payForService(
    subAccountAddress: string | PublicKey,
    agentAddress: string,
    capability: string,
  ): Promise<ServicePaymentResult> {
    const catalog = await this.getAgentCatalog(agentAddress);
    if (!catalog) throw new Error(`Agent ${agentAddress} not found in catalog`);

    const rateCard = catalog.rateCards.find(
      (r) => r.capability.toLowerCase() === capability.toLowerCase(),
    );
    if (!rateCard)
      throw new Error(
        `Agent ${agentAddress} does not offer capability: ${capability}`,
      );

    const agentInfo = await this.connection.getAccountInfo(
      new PublicKey(agentAddress),
    );
    if (!agentInfo) throw new Error("Agent sub-account not found on-chain");
    const vaultPubkey = new PublicKey(agentInfo.data.slice(8, 40));

    const result = await this.pay(
      subAccountAddress,
      vaultPubkey,
      rateCard.priceUsdc,
    );

    const record: UsageRecord = {
      signature: result.signature,
      subAccountAddress:
        typeof subAccountAddress === "string"
          ? subAccountAddress
          : subAccountAddress.toBase58(),
      capability,
      amountUsdc: rateCard.priceUsdc,
      recipient: agentAddress,
      timestamp: new Date().toISOString(),
    };
    this.usageLog.push(record);

    return {
      ...result,
      capability,
      priceUsdc: rateCard.priceUsdc,
    };
  }

  /**
   * Report a usage event for metered tracking.
   *
   * Records a usage entry locally and returns the full log.
   * Can be used to track capability invocations independently
   * of payments (e.g. for free-tier usage, pre-paid bundles).
   *
   * @param record - Usage details (capability, amount, recipient)
   * @returns The complete usage log
   */
  reportUsage(record: Omit<UsageRecord, "timestamp">): UsageRecord[] {
    this.usageLog.push({
      ...record,
      timestamp: new Date().toISOString(),
    });
    return [...this.usageLog];
  }

  /**
   * Get all recorded usage events.
   *
   * @returns The complete usage log
   */
  getUsageLog(): UsageRecord[] {
    return [...this.usageLog];
  }
}
