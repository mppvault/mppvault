import { PublicKey } from "@solana/web3.js";
import {
  getConnection,
  PROGRAM_ID,
  parseVaultAccount,
  parseSubAccount,
  findSubAccountPDA,
} from "./program";

const USDC_DECIMALS = 6;
const U64_MAX = 18446744073709551615n;

function lamportsToUsdc(lamports: bigint): number {
  if (lamports >= U64_MAX - 1000n) return -1;
  return Number(lamports) / 10 ** USDC_DECIMALS;
}

function statusLabel(s: number): "active" | "paused" | "closed" {
  if (s === 0) return "active";
  if (s === 1) return "paused";
  return "closed";
}

export interface RegistryAgent {
  subAccountAddress: string;
  vaultAddress: string;
  vaultAuthority: string;
  vaultName: string;
  agentName: string;
  agentId: string;
  status: "active" | "paused" | "closed";
  balance: number;
  totalBudget: number;
  spent: number;
  txCount: number;
  maxPerTx: number;
  maxPerDay: number;
  hasTimeWindow: boolean;
  hasWhitelist: boolean;
  trustScore: number;
}

export interface RegistryStats {
  totalVaults: number;
  totalAgents: number;
  activeAgents: number;
  totalVolume: number;
  totalTransactions: number;
}

function computeTrustScore(agent: {
  txCount: number;
  spent: number;
  maxPerTx: number;
  maxPerDay: number;
  hasTimeWindow: boolean;
  status: string;
}): number {
  let score = 0;

  if (agent.txCount > 0) score += 20;
  if (agent.txCount >= 5) score += 10;
  if (agent.txCount >= 20) score += 10;

  if (agent.spent > 0) score += 15;

  if (agent.maxPerTx >= 0 && agent.maxPerTx < 1_000_000) score += 15;
  if (agent.maxPerDay >= 0 && agent.maxPerDay < 1_000_000) score += 15;

  if (agent.hasTimeWindow) score += 10;

  if (agent.status === "active") score += 5;

  return Math.min(score, 100);
}

export async function fetchRegistry(): Promise<{
  agents: RegistryAgent[];
  stats: RegistryStats;
}> {
  const connection = getConnection();

  const vaultDiscriminator = await accountDiscriminator("Vault");
  const subAccountDiscriminator = await accountDiscriminator("SubAccount");

  const [vaultAccounts, subAccountAccounts] = await Promise.all([
    connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ memcmp: { offset: 0, bytes: vaultDiscriminator } }],
    }),
    connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ memcmp: { offset: 0, bytes: subAccountDiscriminator } }],
    }),
  ]);

  const vaultMap = new Map<string, { name: string; authority: string }>();
  for (const acc of vaultAccounts) {
    const vault = parseVaultAccount(acc.account.data);
    if (!vault) continue;
    vaultMap.set(acc.pubkey.toBase58(), {
      name: vault.name,
      authority: vault.authority.toBase58(),
    });
  }

  const agents: RegistryAgent[] = [];
  let totalVolume = 0;
  let totalTxs = 0;

  for (const acc of subAccountAccounts) {
    const sub = parseSubAccount(acc.account.data);
    if (!sub) continue;

    const vaultKey = sub.vault.toBase58();
    const vaultInfo = vaultMap.get(vaultKey);

    const spent = lamportsToUsdc(sub.spent);
    const txCount = Number(sub.txCount);
    const maxPerTx = lamportsToUsdc(sub.maxPerTx);
    const maxPerDay = lamportsToUsdc(sub.maxPerDay);

    const agent: RegistryAgent = {
      subAccountAddress: acc.pubkey.toBase58(),
      vaultAddress: vaultKey,
      vaultAuthority: vaultInfo?.authority ?? "unknown",
      vaultName: vaultInfo?.name ?? "Unknown Vault",
      agentName: sub.name,
      agentId: sub.agentId,
      status: statusLabel(sub.status),
      balance: lamportsToUsdc(sub.balance),
      totalBudget: lamportsToUsdc(sub.totalBudget),
      spent,
      txCount,
      maxPerTx,
      maxPerDay,
      hasTimeWindow: sub.timeWindowEnabled,
      hasWhitelist: false,
      trustScore: 0,
    };

    agent.trustScore = computeTrustScore(agent);
    agents.push(agent);

    if (spent > 0) totalVolume += spent;
    totalTxs += txCount;
  }

  agents.sort((a, b) => b.trustScore - a.trustScore || b.txCount - a.txCount);

  return {
    agents,
    stats: {
      totalVaults: vaultAccounts.length,
      totalAgents: subAccountAccounts.length,
      activeAgents: agents.filter((a) => a.status === "active").length,
      totalVolume,
      totalTransactions: totalTxs,
    },
  };
}

async function accountDiscriminator(name: string): string {
  const preimage = new TextEncoder().encode(`account:${name}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(preimage));
  const bytes = Array.from(new Uint8Array(hashBuffer).slice(0, 8));

  const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt("0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join(""));
  let result = "";
  const base = BigInt(58);
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % base)] + result;
    num = num / base;
  }
  for (const b of bytes) {
    if (b === 0) result = "1" + result;
    else break;
  }
  return result;
}
