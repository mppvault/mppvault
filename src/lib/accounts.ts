import { PublicKey } from "@solana/web3.js";
import {
  getConnection,
  findVaultPDA,
  findSubAccountPDA,
  parseVaultAccount,
  parseSubAccount,
} from "./program";
import type { SubAccount, Transaction, WhitelistEntry } from "./mock-data";

const USDC_DECIMALS = 6;
const U64_MAX = 18446744073709551615n;

function lamportsToUsdc(lamports: number | bigint): number {
  if (BigInt(lamports) >= U64_MAX - 1000n) return -1;
  return Number(lamports) / 10 ** USDC_DECIMALS;
}

function statusToString(status: number): "active" | "paused" | "closed" {
  if (status === 0) return "active";
  if (status === 1) return "paused";
  return "closed";
}

function formatTimeFromSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function fetchVault(authority: PublicKey) {
  const connection = getConnection();
  const [vaultPDA] = findVaultPDA(authority);

  try {
    const info = await connection.getAccountInfo(vaultPDA);
    if (!info) return null;

    const vault = parseVaultAccount(info.data);
    if (!vault) return null;

    return {
      address: vaultPDA.toBase58(),
      addressShort:
        vaultPDA.toBase58().slice(0, 4) +
        "..." +
        vaultPDA.toBase58().slice(-4),
      name: vault.name,
      totalDeposited: lamportsToUsdc(vault.totalDeposited),
      totalWithdrawn: lamportsToUsdc(vault.totalWithdrawn),
      subAccountCount: vault.subAccountCount,
      bump: vault.bump,
      publicKey: vaultPDA,
    };
  } catch {
    return null;
  }
}

export async function fetchSubAccounts(
  authority: PublicKey,
): Promise<SubAccount[]> {
  const connection = getConnection();
  const [vaultPDA] = findVaultPDA(authority);

  let vaultInfo;
  try {
    vaultInfo = await connection.getAccountInfo(vaultPDA);
  } catch {
    return [];
  }

  if (!vaultInfo) return [];

  const vaultData = parseVaultAccount(vaultInfo.data);
  if (!vaultData) return [];

  const accounts: SubAccount[] = [];

  for (let i = 0; i < vaultData.subAccountCount; i++) {
    const [subPDA] = findSubAccountPDA(vaultPDA, i);
    try {
      const subInfo = await connection.getAccountInfo(subPDA);
      if (!subInfo) continue;

      const sub = parseSubAccount(subInfo.data);
      if (!sub) continue;

      accounts.push({
        id: subPDA.toBase58(),
        name: sub.name,
        agentId: sub.agentId,
        balance: lamportsToUsdc(sub.balance),
        totalBudget: lamportsToUsdc(sub.totalBudget),
        spent: lamportsToUsdc(sub.spent),
        maxPerTx: lamportsToUsdc(sub.maxPerTx),
        maxPerHour: 0,
        maxPerDay: lamportsToUsdc(sub.maxPerDay),
        status: statusToString(sub.status),
        whitelistCount: 0,
        txCount: Number(sub.txCount),
        lastActive: "–",
        timeWindowStart: sub.timeWindowEnabled
          ? formatTimeFromSeconds(sub.timeWindowStart)
          : undefined,
        timeWindowEnd: sub.timeWindowEnabled
          ? formatTimeFromSeconds(sub.timeWindowEnd)
          : undefined,
        autoTopUp: sub.autoTopupEnabled,
        autoTopUpMin: sub.autoTopupEnabled
          ? lamportsToUsdc(sub.autoTopupMin)
          : undefined,
        autoTopUpTarget: sub.autoTopupEnabled
          ? lamportsToUsdc(sub.autoTopupTarget)
          : undefined,
      });
    } catch {
      continue;
    }
  }

  return accounts;
}

export async function fetchTransactions(
  vaultAddress: PublicKey,
): Promise<Transaction[]> {
  const connection = getConnection();
  const txs: Transaction[] = [];

  try {
    const signatures = await connection.getSignaturesForAddress(
      vaultAddress,
      { limit: 50 },
    );

    for (const sig of signatures) {
      txs.push({
        id: sig.signature.slice(0, 8),
        subAccountId: "",
        subAccountName: "–",
        to: "",
        toLabel: "on-chain tx",
        amount: 0,
        timestamp: sig.blockTime
          ? new Date(sig.blockTime * 1000).toLocaleString()
          : "–",
        status:
          sig.confirmationStatus === "finalized" ||
          sig.confirmationStatus === "confirmed"
            ? "confirmed"
            : "pending",
        signature: sig.signature,
      });
    }
  } catch {
    // RPC error or no transactions
  }

  return txs;
}

export async function fetchWhitelist(
  _subAccountAddress: PublicKey,
): Promise<WhitelistEntry[]> {
  // Whitelist entries are PDAs; to list them all we'd need getProgramAccounts
  // with a filter. For now, return empty — will be populated when program is live.
  return [];
}
