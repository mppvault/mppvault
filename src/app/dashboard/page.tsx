"use client";

import { useState } from "react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import { useVault } from "@/lib/useVault";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { vault, subAccounts, transactions, loading, isOnChain, createVault, refresh } = useVault();

  const [showFundInfo, setShowFundInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletAddress = publicKey?.toBase58() ?? "";

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/[0.12] flex items-center justify-center text-[var(--accent)] text-2xl mb-6">
          ◈
        </div>
        <h2 className="text-[20px] font-semibold tracking-tight mb-2">
          connect your wallet
        </h2>
        <p className="text-[13px] text-neutral-500 mb-6 text-center max-w-xs">
          connect a Solana wallet to access your vault dashboard.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="btn-primary"
        >
          connect wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-[13px] text-neutral-500 animate-pulse">
          loading vault data...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[clamp(22px,2vw,28px)] font-bold tracking-[-0.03em]">
            overview
          </h1>
          <p className="mt-1 text-[12px] text-neutral-600">
            {vault.address}
            {isOnChain && (
              <span className="ml-2 text-[var(--accent)]">● live</span>
            )}
            {!isOnChain && (
              <span className="ml-2 text-neutral-600">● no vault deployed</span>
            )}
          </p>
        </div>
        {!isOnChain && (
          <button
            onClick={() => createVault("My Vault")}
            className="btn-primary text-[13px]"
          >
            deploy vault
          </button>
        )}
        {isOnChain && (
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="rounded-xl border border-white/[0.08] px-3 py-2.5 text-[13px] text-neutral-400 transition-colors hover:border-white/[0.15] hover:text-white"
              title="refresh balances"
            >
              ↻
            </button>
            <button
              onClick={() => setShowFundInfo(true)}
              className="btn-primary text-[13px]"
            >
              fund vault
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="total balance"
          value={`$${vault.totalBalance.toLocaleString()}`}
          sub="USDC in vault"
          accent
        />
        <StatCard
          label="active agents"
          value={`${vault.activeAgents} / ${vault.totalAgents}`}
          sub="sub-accounts"
        />
        <StatCard
          label="spent today"
          value={`$${vault.totalSpentToday.toLocaleString()}`}
          sub="across all agents"
        />
        <StatCard
          label="all-time spent"
          value={`$${vault.totalSpentAllTime.toLocaleString()}`}
          sub={`${transactions.length} transactions`}
        />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold tracking-tight">
            sub-accounts
          </h2>
          <Link
            href="/dashboard/accounts"
            className="text-[12px] text-[var(--accent)] hover:underline transition-colors"
          >
            view all →
          </Link>
        </div>

        {subAccounts.length === 0 ? (
          <div className="liquid-glass rounded-2xl p-8 text-center">
            <p className="text-[13px] text-neutral-600">
              no sub-accounts yet.{" "}
              {isOnChain && "create one to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {subAccounts.map((account) => {
              const pct = (account.spent / account.totalBudget) * 100;
              return (
                <Link
                  key={account.id}
                  href={`/dashboard/accounts/${account.id}`}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl liquid-glass transition-all hover:border-white/[0.12] group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      account.status === "active"
                        ? "bg-[var(--accent)]/[0.15] text-[var(--accent)]"
                        : account.status === "paused"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {account.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-white">
                        {account.name}
                      </span>
                      <span
                        className={`text-[10px] ${
                          account.status === "active"
                            ? "text-[var(--accent)]"
                            : account.status === "paused"
                              ? "text-amber-400"
                              : "text-neutral-600"
                        }`}
                      >
                        {account.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      {account.agentId}
                    </p>
                  </div>
                  <div className="hidden sm:block w-24">
                    <div className="h-1 w-full rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${
                          pct > 90
                            ? "bg-red-400"
                            : pct > 70
                              ? "bg-amber-400"
                              : "bg-[var(--accent)]"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-neutral-600 text-right num">
                      {pct.toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-medium text-white num">
                      ${account.balance.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-neutral-600">balance</p>
                  </div>
                  <span className="text-neutral-700 shrink-0 group-hover:text-[var(--accent)] transition-colors">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold tracking-tight">
            recent transactions
          </h2>
          <Link
            href="/dashboard/transactions"
            className="text-[12px] text-[var(--accent)] hover:underline transition-colors"
          >
            view all →
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="liquid-glass rounded-2xl p-8 text-center">
            <p className="text-[13px] text-neutral-600">
              no transactions yet.
            </p>
          </div>
        ) : (
          <div className="liquid-glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3 text-left text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                    agent
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                    to
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                    amount
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                    status
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                    time
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                    tx
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`transition-colors hover:bg-white/[0.02] ${
                      i < 4 ? "border-b border-white/[0.04]" : ""
                    }`}
                  >
                    <td className="px-5 py-3 text-[13px] text-white">
                      {tx.subAccountName}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[13px] text-white">
                        {tx.toLabel}
                      </span>
                      <span className="text-[10px] text-neutral-700 ml-2 font-mono">
                        {tx.to}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-medium text-white num">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          tx.status === "confirmed"
                            ? "text-[var(--accent)] bg-[var(--accent)]/[0.10]"
                            : tx.status === "pending"
                              ? "text-amber-400 bg-amber-400/10"
                              : "text-red-400 bg-red-400/10"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] text-neutral-600">
                      {tx.timestamp}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`https://solscan.io/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-neutral-600 hover:text-[var(--accent)] transition-colors"
                      >
                        ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showFundInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="liquid-glass rounded-2xl p-7 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold tracking-tight">how to fund your agents</h3>
              <button
                onClick={() => setShowFundInfo(false)}
                className="text-neutral-600 hover:text-white transition-colors text-[18px]"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--accent)]/[0.15] text-[var(--accent)] text-[10px] font-bold">1</span>
                  <p className="text-[12px] text-white font-medium">get USDC in your Phantom wallet</p>
                </div>
                <p className="text-[11px] text-neutral-500 ml-7">
                  send USDC to your connected wallet from an exchange, or swap SOL for USDC.
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--accent)]/[0.15] text-[var(--accent)] text-[10px] font-bold">2</span>
                  <p className="text-[12px] text-white font-medium">fund an agent</p>
                </div>
                <p className="text-[11px] text-neutral-500 ml-7">
                  go to a sub-account and click <strong className="text-white">fund this agent</strong>. USDC moves from your wallet into the vault automatically.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 mb-4">
              <p className="text-[10px] text-neutral-600 uppercase tracking-[0.1em] mb-1">your wallet address</p>
              <p className="text-[11px] text-white font-mono break-all leading-relaxed">{walletAddress}</p>
            </div>

            <button onClick={copyAddress} className="w-full btn-primary text-[13px]">
              {copied ? "copied ✓" : "copy wallet address"}
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--accent)]/[0.06] border border-[var(--accent)]/[0.12] px-4 py-3">
              <span className="text-[var(--accent)] text-[13px] mt-0.5">◈</span>
              <p className="text-[11px] text-[var(--accent)]/80 leading-relaxed">
                don&apos;t have USDC?{" "}
                <a href="https://jup.ag/swap/SOL-USDC" target="_blank" rel="noopener noreferrer" className="underline">
                  swap on Jupiter ↗
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
