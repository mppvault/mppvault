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
        spentToday: lamportsToUsdc(sub.spentToday),
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
  subAccounts: SubAccount[],
): Promise<Transaction[]> {
  const connection = getConnection();
  const txs: Transaction[] = [];
  const { PROGRAM_ID } = await import("./program");
  const programId = PROGRAM_ID.toBase58();

  try {
    const signatures = await connection.getSignaturesForAddress(
      vaultAddress,
      { limit: 50 },
    );

    const batchSize = 10;
    for (let i = 0; i < signatures.length; i += batchSize) {
      const batch = signatures.slice(i, i + batchSize);
      const parsedBatch = await Promise.allSettled(
        batch.map(sig => connection.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 }))
      );

      for (let j = 0; j < batch.length; j++) {
        const sig = batch[j];
        const result = parsedBatch[j];
        const parsed = result.status === "fulfilled" ? result.value : null;

        let amount = 0;
        let toLabel = "on-chain tx";
        let to = "";
        let subAccountId = "";
        let subAccountName = "–";

        if (parsed?.transaction) {
          const ixs = parsed.transaction.message.instructions;
          for (const ix of ixs) {
            if ("programId" in ix && ix.programId.toBase58() === programId && "accounts" in ix && ix.accounts) {
              const accs = ix.accounts as PublicKey[];
              if (accs.length >= 6) {
                const subAccAddr = accs[2].toBase58();
                const matched = subAccounts.find(s => s.id === subAccAddr);
                if (matched) {
                  subAccountId = matched.id;
                  subAccountName = matched.name;
                }
              }
            }
          }

          const pre = parsed.meta?.preTokenBalances ?? [];
          const post = parsed.meta?.postTokenBalances ?? [];
          const vaultAddr = vaultAddress.toBase58();
          for (const postBal of post) {
            if (postBal.owner === vaultAddr) {
              const preBal = pre.find(p => p.accountIndex === postBal.accountIndex);
              const preAmt = preBal?.uiTokenAmount?.uiAmount ?? 0;
              const postAmt = postBal.uiTokenAmount?.uiAmount ?? 0;
              const diff = (postAmt ?? 0) - (preAmt ?? 0);
              if (diff !== 0) {
                amount = Math.abs(diff);
                toLabel = diff > 0 ? "deposit" : "withdrawal";
                break;
              }
            }
          }

          if (amount === 0 && toLabel === "on-chain tx") {
            for (const postBal of post) {
              if (postBal.owner !== vaultAddr) {
                const preBal = pre.find(p => p.accountIndex === postBal.accountIndex);
                const preAmt = preBal?.uiTokenAmount?.uiAmount ?? 0;
                const postAmt = postBal.uiTokenAmount?.uiAmount ?? 0;
                const diff = (postAmt ?? 0) - (preAmt ?? 0);
                if (diff > 0) {
                  amount = diff;
                  to = postBal.owner ?? "";
                  toLabel = "payment";
                  break;
                }
              }
            }
          }
        }

        txs.push({
          id: sig.signature.slice(0, 8),
          subAccountId,
          subAccountName,
          to,
          toLabel,
          amount,
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
    }
  } catch {
    // RPC error or no transactions
  }

  return txs;
}

export async function fetchWhitelist(
  subAccountAddress: PublicKey,
): Promise<WhitelistEntry[]> {
  const connection = getConnection();
  const { PROGRAM_ID } = await import("./program");

  try {
    // Compute Anchor account discriminator: sha256("account:WhitelistEntry")[..8]
    const preimage = new TextEncoder().encode("account:WhitelistEntry");
    const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(preimage));
    const discriminator = Array.from(new Uint8Array(hashBuffer).slice(0, 8));

    // Encode discriminator bytes as base58 for the memcmp filter
    const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    function toBase58(bytes: number[]): string {
      let num = BigInt("0x" + bytes.map(b => b.toString(16).padStart(2, "0")).join(""));
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

    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { memcmp: { offset: 0, bytes: toBase58(discriminator) } },
        { memcmp: { offset: 8, bytes: subAccountAddress.toBase58() } },
      ],
    });

    return accounts.map((acc) => {
      const d = acc.account.data;
      // layout: discriminator(8) + sub_account(32) + recipient(32) + label_len(4) + label + is_active(1)
      const recipient = new PublicKey(d.slice(40, 72)).toBase58();
      const labelLen = d.readUInt32LE(72);
      const label = d.slice(76, 76 + labelLen).toString("utf8");
      return {
        address: recipient,
        label,
        addedAt: "",
      };
    });
  } catch {
    return [];
  }
}
