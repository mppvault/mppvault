"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import {
  PROGRAM_ID,
  getConnection,
  findVaultPDA,
  findSubAccountPDA,
  findWhitelistPDA,
  createVaultInstruction,
  createSubAccountInstruction,
  pauseSubAccountInstruction,
  resumeSubAccountInstruction,
  setSpendingRulesInstruction,
  addWhitelistInstruction,
  removeWhitelistInstruction,
  depositInstruction,
  withdrawInstruction,
  parseVaultAccount,
} from "./program";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function findAssociatedTokenAddress(wallet: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

const SYSVAR_RENT = new PublicKey("SysvarRent111111111111111111111111111111111");

function createAssociatedTokenAccountIdempotentIx(
  payer: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  const ata = findAssociatedTokenAddress(owner, mint);
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]),
  });
}

import {
  fetchVault,
  fetchSubAccounts,
  fetchTransactions,
  fetchWhitelist,
} from "./accounts";
import type {
  SubAccount,
  Transaction as TxType,
  WhitelistEntry,
} from "./mock-data";

export interface VaultData {
  address: string;
  totalBalance: number;
  totalAgents: number;
  activeAgents: number;
  totalSpentToday: number;
  totalSpentAllTime: number;
  multiSigThreshold: number;
  multiSigSigners: number;
  multiSigLimit: number;
}

async function sendAndConfirm(
  connection: Connection,
  ix: TransactionInstruction | TransactionInstruction[],
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  payer: PublicKey,
) {
  const tx = new Transaction();
  const ixs = Array.isArray(ix) ? ix : [ix];
  for (const i of ixs) tx.add(i);
  tx.feePayer = payer;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  const signed = await signTransaction(tx);

  let sig: string;
  try {
    sig = await connection.sendRawTransaction(signed.serialize(), {
      preflightCommitment: "confirmed",
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "getLogs" in err) {
      try {
        const logs = await (err as { getLogs: (c: Connection) => Promise<string[]> }).getLogs(connection);
        console.error("Transaction logs:", logs);
      } catch { /* getLogs failed */ }
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Transaction failed: ${msg}`);
  }

  const confirmation = await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  if (confirmation.value.err) {
    throw new Error(`Transaction confirmed but failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
  }

  return sig;
}

export function useVault() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const emptyVault: VaultData = {
    address: "–",
    totalBalance: 0,
    totalAgents: 0,
    activeAgents: 0,
    totalSpentToday: 0,
    totalSpentAllTime: 0,
    multiSigThreshold: 0,
    multiSigSigners: 0,
    multiSigLimit: 0,
  };

  const [vault, setVault] = useState<VaultData>(emptyVault);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [transactions, setTransactions] = useState<TxType[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [whitelistMap, setWhitelistMap] = useState<Record<string, WhitelistEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [isOnChain, setIsOnChain] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setVault(emptyVault);
      setSubAccounts([]);
      setTransactions([]);
      setWhitelist([]);
      setIsOnChain(false);
      return;
    }

    setLoading(true);
    try {
      const v = await fetchVault(publicKey);

      if (v) {
        const subs = await fetchSubAccounts(publicKey);
        const txs = await fetchTransactions(v.publicKey, subs);

        let vaultUsdcBalance = 0;
        try {
          const conn = getConnection();
          const vaultATA = findAssociatedTokenAddress(v.publicKey, USDC_MINT);
          const bal = await conn.getTokenAccountBalance(vaultATA);
          vaultUsdcBalance = Number(bal.value.uiAmount ?? 0);
        } catch { /* no USDC in vault yet */ }

        const subAccountBalanceSum = subs.reduce((s, a) => s + a.balance, 0);
        const totalBalance = vaultUsdcBalance > 0 ? vaultUsdcBalance : subAccountBalanceSum;
        const activeAgents = subs.filter(
          (a) => a.status === "active",
        ).length;

        setVault({
          address: v.addressShort,
          totalBalance,
          totalAgents: subs.length,
          activeAgents,
          totalSpentToday: subs.reduce((s, a) => s + a.spentToday, 0),
          totalSpentAllTime: subs.reduce((s, a) => s + a.spent, 0),
          multiSigThreshold: 1,
          multiSigSigners: 1,
          multiSigLimit: 0,
        });

        // Fetch whitelist for each sub-account
        const wMap: Record<string, WhitelistEntry[]> = {};
        await Promise.all(
          subs.map(async (sub) => {
            try {
              const entries = await fetchWhitelist(new PublicKey(sub.id));
              wMap[sub.id] = entries;
            } catch {
              wMap[sub.id] = [];
            }
          })
        );

        // Patch whitelistCount into sub-accounts
        const subsWithCount = subs.map((s) => ({
          ...s,
          whitelistCount: wMap[s.id]?.length ?? 0,
        }));

        setSubAccounts(subsWithCount);
        setTransactions(txs.length > 0 ? txs : []);
        setWhitelist([]);
        setWhitelistMap(wMap);
        setIsOnChain(true);
      } else {
        setVault({
          ...emptyVault,
          address:
            publicKey.toBase58().slice(0, 4) +
            "..." +
            publicKey.toBase58().slice(-4),
        });
        setSubAccounts([]);
        setTransactions([]);
        setWhitelist([]);
        setWhitelistMap({});
        setIsOnChain(false);
      }
    } catch {
      setIsOnChain(false);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const createVault = useCallback(
    async (name: string) => {
      if (!publicKey || !signTransaction)
        throw new Error("Wallet not connected");

      const ix = await createVaultInstruction(publicKey, name);
      const sig = await sendAndConfirm(
        connection,
        ix,
        signTransaction,
        publicKey,
      );
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const createSubAccount = useCallback(
    async (name: string, agentId: string, totalBudget: number) => {
      if (!publicKey || !signTransaction)
        throw new Error("Wallet not connected");

      const [vaultPDA] = findVaultPDA(publicKey);
      const info = await connection.getAccountInfo(vaultPDA);
      if (!info) throw new Error("Vault not found on-chain. Deploy your vault first.");

      const vaultData = parseVaultAccount(info.data);
      if (!vaultData) throw new Error("Failed to parse vault data");

      const [subPDA] = findSubAccountPDA(
        vaultPDA,
        vaultData.subAccountCount,
      );

      const budgetLamports = BigInt(Math.round(totalBudget * 10 ** 6));
      const ix = await createSubAccountInstruction(
        publicKey,
        vaultPDA,
        subPDA,
        name,
        agentId,
        budgetLamports,
      );

      const sig = await sendAndConfirm(
        connection,
        ix,
        signTransaction,
        publicKey,
      );
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const pauseSubAccount = useCallback(
    async (subAccountAddress: string) => {
      if (!publicKey || !signTransaction)
        throw new Error("Wallet not connected");

      const [vaultPDA] = findVaultPDA(publicKey);
      const ix = await pauseSubAccountInstruction(
        publicKey,
        vaultPDA,
        new PublicKey(subAccountAddress),
      );
      const sig = await sendAndConfirm(
        connection,
        ix,
        signTransaction,
        publicKey,
      );
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const resumeSubAccount = useCallback(
    async (subAccountAddress: string) => {
      if (!publicKey || !signTransaction)
        throw new Error("Wallet not connected");

      const [vaultPDA] = findVaultPDA(publicKey);
      const ix = await resumeSubAccountInstruction(
        publicKey,
        vaultPDA,
        new PublicKey(subAccountAddress),
      );
      const sig = await sendAndConfirm(
        connection,
        ix,
        signTransaction,
        publicKey,
      );
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const setSpendingRules = useCallback(
    async (
      subAccountAddress: string,
      maxPerTx: number,
      maxPerDay: number,
    ) => {
      if (!publicKey || !signTransaction)
        throw new Error("Wallet not connected");

      const [vaultPDA] = findVaultPDA(publicKey);
      const ix = await setSpendingRulesInstruction(
        publicKey,
        vaultPDA,
        new PublicKey(subAccountAddress),
        BigInt(Math.round(maxPerTx * 10 ** 6)),
        BigInt(Math.round(maxPerDay * 10 ** 6)),
      );
      const sig = await sendAndConfirm(
        connection,
        ix,
        signTransaction,
        publicKey,
      );
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const addToWhitelist = useCallback(
    async (
      subAccountAddress: string,
      address: string,
      label: string,
    ) => {
      if (!publicKey || !signTransaction)
        throw new Error("Wallet not connected");

      const [vaultPDA] = findVaultPDA(publicKey);
      const subPubkey = new PublicKey(subAccountAddress);
      const addrPubkey = new PublicKey(address);
      const [whitelistPDA] = findWhitelistPDA(subPubkey, addrPubkey);

      const ix = await addWhitelistInstruction(
        publicKey,
        vaultPDA,
        subPubkey,
        whitelistPDA,
        addrPubkey,
        label,
      );
      const sig = await sendAndConfirm(
        connection,
        ix,
        signTransaction,
        publicKey,
      );
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const removeFromWhitelist = useCallback(
    async (subAccountAddress: string, address: string) => {
      if (!publicKey || !signTransaction)
        throw new Error("Wallet not connected");

      const [vaultPDA] = findVaultPDA(publicKey);
      const subPubkey = new PublicKey(subAccountAddress);
      const addrPubkey = new PublicKey(address);
      const [whitelistPDA] = findWhitelistPDA(subPubkey, addrPubkey);

      const ix = await removeWhitelistInstruction(
        publicKey,
        vaultPDA,
        subPubkey,
        whitelistPDA,
      );
      const sig = await sendAndConfirm(
        connection,
        ix,
        signTransaction,
        publicKey,
      );
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const deposit = useCallback(
    async (amount: number, subAccountId: string) => {
      if (!publicKey || !signTransaction) throw new Error("Wallet not connected");
      const [vaultPDA] = findVaultPDA(publicKey);
      const subAccountPubkey = new PublicKey(subAccountId);

      const vaultTokenAccount = findAssociatedTokenAddress(vaultPDA, USDC_MINT);

      const amountLamports = BigInt(Math.round(amount * 10 ** 6));
      const ixs: TransactionInstruction[] = [];

      const userAccounts = await connection.getTokenAccountsByOwner(publicKey, { mint: USDC_MINT });
      if (userAccounts.value.length === 0) {
        throw new Error("No USDC found in your wallet. Buy or receive USDC first.");
      }
      const parseBalance = (data: Buffer | Uint8Array) =>
        BigInt("0x" + Buffer.from(data.slice(64, 72)).reverse().toString("hex"));
      const sorted = [...userAccounts.value].sort((a, b) =>
        Number(parseBalance(b.account.data) - parseBalance(a.account.data)),
      );
      const depositorTokenAccount = sorted[0].pubkey;
      const depositorBalance = parseBalance(sorted[0].account.data);

      if (depositorBalance < amountLamports) {
        throw new Error(`Insufficient USDC: have ${Number(depositorBalance) / 1e6}, need ${Number(amountLamports) / 1e6}`);
      }

      const vaultAtaInfo = await connection.getAccountInfo(vaultTokenAccount);
      if (!vaultAtaInfo) {
        ixs.push(createAssociatedTokenAccountIdempotentIx(publicKey, vaultPDA, USDC_MINT));
      }

      ixs.push(await depositInstruction(
        publicKey, vaultPDA, subAccountPubkey, depositorTokenAccount, vaultTokenAccount, TOKEN_PROGRAM_ID, amountLamports,
      ));

      const sig = await sendAndConfirm(connection, ixs, signTransaction, publicKey);
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const withdraw = useCallback(
    async (amount: number, subAccountId: string) => {
      if (!publicKey || !signTransaction) throw new Error("Wallet not connected");
      const [vaultPDA] = findVaultPDA(publicKey);
      const subAccountPubkey = new PublicKey(subAccountId);
      const vaultTokenAccount = findAssociatedTokenAddress(vaultPDA, USDC_MINT);
      const recipientTokenAccount = findAssociatedTokenAddress(publicKey, USDC_MINT);
      const amountLamports = BigInt(Math.round(amount * 10 ** 6));
      const ix = await withdrawInstruction(
        publicKey, vaultPDA, subAccountPubkey, vaultTokenAccount, recipientTokenAccount, TOKEN_PROGRAM_ID, amountLamports,
      );
      const sig = await sendAndConfirm(connection, ix, signTransaction, publicKey);
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  return {
    vault,
    subAccounts,
    transactions,
    whitelist,
    whitelistMap,
    loading,
    isOnChain,
    connected,
    refresh,
    createVault,
    createSubAccount,
    pauseSubAccount,
    resumeSubAccount,
    setSpendingRules,
    addToWhitelist,
    removeFromWhitelist,
    deposit,
    withdraw,
  };
}
