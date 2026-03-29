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
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bwd");

function findAssociatedTokenAddress(wallet: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

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
    ],
    data: Buffer.from([1]),
  });
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

      const ixs: TransactionInstruction[] = [];

      // Find user's actual USDC token account
      let depositorTokenAccount: PublicKey;
      const userAccounts = await connection.getTokenAccountsByOwner(publicKey, { mint: USDC_MINT });
      if (userAccounts.value.length > 0) {
        depositorTokenAccount = userAccounts.value[0].pubkey;
      } else {
        throw new Error("No USDC found in your wallet. Buy or receive USDC first.");
      }

      // Create vault ATA if needed
      const vaultAtaInfo = await connection.getAccountInfo(vaultTokenAccount);
      if (!vaultAtaInfo) {
        ixs.push(createAssociatedTokenAccountIdempotentIx(publicKey, vaultPDA, USDC_MINT));
      }

      const amountLamports = BigInt(Math.round(amount * 10 ** 6));
      ixs.push(await depositInstruction(
        publicKey, vaultPDA, subAccountPubkey, depositorTokenAccount, vaultTokenAccount, TOKEN_PROGRAM_ID, amountLamports,
      ));

      console.log("=== DEPOSIT DEBUG ===");
      console.log("PROGRAM_ID:", PROGRAM_ID.toBase58());
      console.log("TOKEN_PROGRAM_ID:", TOKEN_PROGRAM_ID.toBase58());
      console.log("ASSOC_TOKEN_PROGRAM:", ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
      console.log("authority:", publicKey.toBase58());
      console.log("vault PDA:", vaultPDA.toBase58());
      console.log("subAccount:", subAccountPubkey.toBase58());
      console.log("depositorTokenAccount:", depositorTokenAccount.toBase58());
      console.log("vaultTokenAccount:", vaultTokenAccount.toBase58());
      console.log("USDC_MINT:", USDC_MINT.toBase58());
      console.log("vault ATA exists:", !!vaultAtaInfo);
      console.log("num instructions:", ixs.length);
      for (let i = 0; i < ixs.length; i++) {
        console.log(`ix[${i}] programId:`, ixs[i].programId.toBase58());
        console.log(`ix[${i}] keys:`, ixs[i].keys.map(k => k.pubkey.toBase58()));
      }

      // Simulate first to get detailed logs
      const simTx = new Transaction();
      for (const i of ixs) simTx.add(i);
      simTx.feePayer = publicKey;
      simTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      try {
        const sim = await connection.simulateTransaction(simTx);
        console.log("Simulation result:", JSON.stringify(sim.value, null, 2));
        if (sim.value.err) {
          throw new Error(`Simulation failed: ${JSON.stringify(sim.value.err)}. Logs: ${(sim.value.logs ?? []).join(" | ")}`);
        }
      } catch (simErr: unknown) {
        if (simErr instanceof Error && simErr.message.startsWith("Simulation failed:")) throw simErr;
        console.error("Simulation error:", simErr);
        throw new Error(`Deposit simulation error: ${simErr instanceof Error ? simErr.message : String(simErr)}`);
      }

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
