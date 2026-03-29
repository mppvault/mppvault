"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, type TransactionInstruction } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import {
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
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bwd");

function findAssociatedTokenAddress(wallet: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}
import {
  fetchVault,
  fetchSubAccounts,
  fetchTransactions,
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
  ix: TransactionInstruction,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  payer: PublicKey,
) {
  const tx = new Transaction().add(ix);
  tx.feePayer = payer;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(sig, "confirmed");
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
        const txs = await fetchTransactions(v.publicKey);

        // fetch vault's actual USDC token balance from ATA
        let vaultUsdcBalance = 0;
        try {
          const conn = getConnection();
          const vaultATA = findAssociatedTokenAddress(v.publicKey, USDC_MINT);
          const bal = await conn.getTokenAccountBalance(vaultATA);
          vaultUsdcBalance = Number(bal.value.uiAmount ?? 0);
        } catch { /* ATA not initialized yet */ }

        const totalBalance = vaultUsdcBalance > 0 ? vaultUsdcBalance : subs.reduce((s, a) => s + a.balance, 0);
        const activeAgents = subs.filter(
          (a) => a.status === "active",
        ).length;

        setVault({
          address: v.addressShort,
          totalBalance,
          totalAgents: subs.length,
          activeAgents,
          totalSpentToday: 0,
          totalSpentAllTime: subs.reduce((s, a) => s + a.spent, 0),
          multiSigThreshold: 1,
          multiSigSigners: 1,
          multiSigLimit: 0,
        });

        setSubAccounts(subs);
        setTransactions(txs.length > 0 ? txs : []);
        setWhitelist([]);
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

      const conn = getConnection();
      const [vaultPDA] = findVaultPDA(publicKey);
      const info = await conn.getAccountInfo(vaultPDA);
      if (!info) throw new Error("Vault not found");

      const vaultData = parseVaultAccount(info.data);
      if (!vaultData) throw new Error("Failed to parse vault");

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

      // find user's actual USDC token account dynamically
      const userTokenAccounts = await connection.getTokenAccountsByOwner(publicKey, { mint: USDC_MINT });
      if (userTokenAccounts.value.length === 0) {
        throw new Error("no USDC found in your wallet. buy USDC on Jupiter first.");
      }
      const depositorTokenAccount = userTokenAccounts.value[0].pubkey;

      // find or derive vault token account
      const vaultTokenAccount = findAssociatedTokenAddress(vaultPDA, USDC_MINT);

      const amountLamports = BigInt(Math.round(amount * 10 ** 6));
      const ix = await depositInstruction(
        publicKey, vaultPDA, subAccountPubkey, vaultTokenAccount, depositorTokenAccount, TOKEN_PROGRAM_ID, amountLamports,
      );
      const sig = await sendAndConfirm(connection, ix, signTransaction, publicKey);
      await refresh();
      return sig;
    },
    [publicKey, signTransaction, connection, refresh],
  );

  const withdraw = useCallback(
    async (amount: number) => {
      if (!publicKey || !signTransaction) throw new Error("Wallet not connected");
      const [vaultPDA] = findVaultPDA(publicKey);
      const vaultTokenAccount = findAssociatedTokenAddress(vaultPDA, USDC_MINT);
      const recipientTokenAccount = findAssociatedTokenAddress(publicKey, USDC_MINT);
      const amountLamports = BigInt(Math.round(amount * 10 ** 6));
      const ix = await withdrawInstruction(
        publicKey, vaultPDA, vaultTokenAccount, recipientTokenAccount, TOKEN_PROGRAM_ID, amountLamports,
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
