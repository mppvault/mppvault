import {
  Connection,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID ||
    "2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx",
);

export function getConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    clusterApiUrl("mainnet-beta");
  return new Connection(rpcUrl, "confirmed");
}

export function findVaultPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), authority.toBuffer()],
    PROGRAM_ID,
  );
}

export function findSubAccountPDA(
  vault: PublicKey,
  index: number,
): [PublicKey, number] {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(index);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("sub_account"), vault.toBuffer(), buf],
    PROGRAM_ID,
  );
}

export function findWhitelistPDA(
  subAccount: PublicKey,
  address: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("whitelist"), subAccount.toBuffer(), address.toBuffer()],
    PROGRAM_ID,
  );
}

function encodeString(s: string): Buffer {
  const strBuf = Buffer.from(s, "utf-8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBuf.length);
  return Buffer.concat([lenBuf, strBuf]);
}

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

function decodeI64(buf: Buffer | Uint8Array, offset: number): bigint {
  const unsigned = decodeU64(buf, offset);
  if (unsigned >= 2n ** 63n) {
    return unsigned - 2n ** 64n;
  }
  return unsigned;
}

async function anchorDiscriminator(name: string): Promise<Buffer> {
  const data = new TextEncoder().encode(`global:${name}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(data));
  return Buffer.from(new Uint8Array(hashBuffer).slice(0, 8));
}

export async function createVaultInstruction(
  authority: PublicKey,
  name: string,
): Promise<TransactionInstruction> {
  const [vaultPDA] = findVaultPDA(authority);

  const data = Buffer.concat([
    await anchorDiscriminator("create_vault"),
    encodeString(name),
  ]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function createSubAccountInstruction(
  authority: PublicKey,
  vault: PublicKey,
  subAccount: PublicKey,
  name: string,
  agentId: string,
  totalBudget: bigint,
): Promise<TransactionInstruction> {
  const data = Buffer.concat([
    await anchorDiscriminator("create_sub_account"),
    encodeString(name),
    encodeString(agentId),
    encodeU64(totalBudget),
  ]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: subAccount, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function pauseSubAccountInstruction(
  authority: PublicKey,
  vault: PublicKey,
  subAccount: PublicKey,
): Promise<TransactionInstruction> {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: vault, isSigner: false, isWritable: false },
      { pubkey: subAccount, isSigner: false, isWritable: true },
    ],
    data: await anchorDiscriminator("pause_sub_account"),
  });
}

export async function resumeSubAccountInstruction(
  authority: PublicKey,
  vault: PublicKey,
  subAccount: PublicKey,
): Promise<TransactionInstruction> {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: vault, isSigner: false, isWritable: false },
      { pubkey: subAccount, isSigner: false, isWritable: true },
    ],
    data: await anchorDiscriminator("resume_sub_account"),
  });
}

export async function setSpendingRulesInstruction(
  authority: PublicKey,
  vault: PublicKey,
  subAccount: PublicKey,
  maxPerTx: bigint,
  maxPerDay: bigint,
): Promise<TransactionInstruction> {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: vault, isSigner: false, isWritable: false },
      { pubkey: subAccount, isSigner: false, isWritable: true },
    ],
    data: Buffer.concat([
      await anchorDiscriminator("set_spending_rules"),
      encodeU64(maxPerTx),
      encodeU64(maxPerDay),
    ]),
  });
}

export async function addWhitelistInstruction(
  authority: PublicKey,
  vault: PublicKey,
  subAccount: PublicKey,
  whitelistEntry: PublicKey,
  address: PublicKey,
  label: string,
): Promise<TransactionInstruction> {
  const data = Buffer.concat([
    await anchorDiscriminator("add_whitelist"),
    address.toBuffer(),
    encodeString(label),
  ]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: false },
      { pubkey: subAccount, isSigner: false, isWritable: false },
      { pubkey: whitelistEntry, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function depositInstruction(
  authority: PublicKey,
  vault: PublicKey,
  vaultTokenAccount: PublicKey,
  depositorTokenAccount: PublicKey,
  tokenProgram: PublicKey,
  amount: bigint,
): Promise<TransactionInstruction> {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
      { pubkey: depositorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenProgram, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      await anchorDiscriminator("deposit"),
      encodeU64(amount),
    ]),
  });
}

export async function withdrawInstruction(
  authority: PublicKey,
  vault: PublicKey,
  vaultTokenAccount: PublicKey,
  recipientTokenAccount: PublicKey,
  tokenProgram: PublicKey,
  amount: bigint,
): Promise<TransactionInstruction> {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
      { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenProgram, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      await anchorDiscriminator("withdraw"),
      encodeU64(amount),
    ]),
  });
}

export async function removeWhitelistInstruction(
  authority: PublicKey,
  vault: PublicKey,
  subAccount: PublicKey,
  whitelistEntry: PublicKey,
): Promise<TransactionInstruction> {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: false },
      { pubkey: subAccount, isSigner: false, isWritable: false },
      { pubkey: whitelistEntry, isSigner: false, isWritable: true },
    ],
    data: await anchorDiscriminator("remove_whitelist"),
  });
}

export interface VaultAccount {
  authority: PublicKey;
  name: string;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  subAccountCount: number;
  bump: number;
}

export interface SubAccountRaw {
  vault: PublicKey;
  name: string;
  agentId: string;
  balance: bigint;
  totalBudget: bigint;
  spent: bigint;
  status: number;
  maxPerTx: bigint;
  maxPerDay: bigint;
  spentToday: bigint;
  lastDayReset: bigint;
  timeWindowStart: number;
  timeWindowEnd: number;
  timeWindowEnabled: boolean;
  autoTopupEnabled: boolean;
  autoTopupMin: bigint;
  autoTopupTarget: bigint;
  txCount: bigint;
  bump: number;
}

function readString(buf: Buffer | Uint8Array, offset: number): [string, number] {
  const len = buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24);
  const str = Buffer.from(buf.slice(offset + 4, offset + 4 + len)).toString("utf-8");
  return [str, offset + 4 + len];
}

export function parseVaultAccount(data: Buffer | Uint8Array): VaultAccount | null {
  try {
    let offset = 8;
    const authority = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    const [name, off2] = readString(data, offset);
    offset = off2;
    const totalDeposited = decodeU64(data, offset);
    offset += 8;
    const totalWithdrawn = decodeU64(data, offset);
    offset += 8;
    const subAccountCount = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    offset += 4;
    const bump = data[offset];

    return { authority, name, totalDeposited, totalWithdrawn, subAccountCount, bump };
  } catch {
    return null;
  }
}

export function parseSubAccount(data: Buffer | Uint8Array): SubAccountRaw | null {
  try {
    let offset = 8;
    const vault = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    const [name, off2] = readString(data, offset);
    offset = off2;
    const [agentId, off3] = readString(data, offset);
    offset = off3;
    const balance = decodeU64(data, offset); offset += 8;
    const totalBudget = decodeU64(data, offset); offset += 8;
    const spent = decodeU64(data, offset); offset += 8;
    const status = data[offset]; offset += 1;
    const maxPerTx = decodeU64(data, offset); offset += 8;
    const maxPerDay = decodeU64(data, offset); offset += 8;
    const spentToday = decodeU64(data, offset); offset += 8;
    const lastDayReset = decodeI64(data, offset); offset += 8;
    const timeWindowStart = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    offset += 4;
    const timeWindowEnd = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    offset += 4;
    const timeWindowEnabled = data[offset] === 1; offset += 1;
    const autoTopupEnabled = data[offset] === 1; offset += 1;
    const autoTopupMin = decodeU64(data, offset); offset += 8;
    const autoTopupTarget = decodeU64(data, offset); offset += 8;
    const txCount = decodeU64(data, offset); offset += 8;
    const bump = data[offset];

    return {
      vault, name, agentId, balance, totalBudget, spent, status,
      maxPerTx, maxPerDay, spentToday, lastDayReset,
      timeWindowStart, timeWindowEnd, timeWindowEnabled,
      autoTopupEnabled, autoTopupMin, autoTopupTarget, txCount, bump,
    };
  } catch {
    return null;
  }
}
