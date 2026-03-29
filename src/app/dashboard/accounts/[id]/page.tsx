"use client";

import { use, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import { useVault } from "@/lib/useVault";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    subAccounts,
    transactions,
    isOnChain,
    whitelistMap,
    pauseSubAccount,
    resumeSubAccount,
    setSpendingRules,
    addToWhitelist,
    removeFromWhitelist,
    deposit,
  } = useVault();

  const [showFund, setShowFund] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState("");

  const handleFund = async (accountId: string) => {
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) return;
    setFundLoading(true);
    setFundError("");
    try {
      await deposit(Number(fundAmount), accountId);
      setShowFund(false);
      setFundAmount("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("AccountNotInitialized") || msg.includes("from_token_account")) {
        setFundError("your Phantom wallet doesn't have a USDC account. buy USDC on Jupiter first, then try again.");
      } else {
        setFundError(msg);
      }
    } finally {
      setFundLoading(false);
    }
  };

  const [showRules, setShowRules] = useState(false);
  const [maxPerTx, setMaxPerTx] = useState("");
  const [maxPerDay, setMaxPerDay] = useState("");
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState("");

  const [showWhitelist, setShowWhitelist] = useState(false);
  const [whitelistAddr, setWhitelistAddr] = useState("");
  const [whitelistLabel, setWhitelistLabel] = useState("");
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [whitelistError, setWhitelistError] = useState("");

  const handleSetRules = async (accountId: string) => {
    if (!maxPerTx || !maxPerDay) return;
    setRulesLoading(true);
    setRulesError("");
    try {
      await setSpendingRules(accountId, Number(maxPerTx), Number(maxPerDay));
      setShowRules(false);
    } catch (e: unknown) {
      setRulesError(e instanceof Error ? e.message : "Failed");
    } finally {
      setRulesLoading(false);
    }
  };

  const handleAddWhitelist = async (accountId: string) => {
    if (!whitelistAddr || !whitelistLabel) return;
    setWhitelistLoading(true);
    setWhitelistError("");
    try {
      await addToWhitelist(accountId, whitelistAddr, whitelistLabel);
      setWhitelistAddr("");
      setWhitelistLabel("");
      setShowWhitelist(false);
    } catch (e: unknown) {
      setWhitelistError(e instanceof Error ? e.message : "Failed");
    } finally {
      setWhitelistLoading(false);
    }
  };

  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const account = subAccounts.find((a) => a.id === id);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-[15px] text-neutral-500">sub-account not found</p>
        <Link
          href="/dashboard/accounts"
          className="mt-4 text-[13px] text-neutral-500 hover:text-white transition-colors"
        >
          ← back to accounts
        </Link>
      </div>
    );
  }

  const accountTxs = transactions.filter(
    (tx) => tx.subAccountId === account.id,
  );
  const pct = (account.spent / account.totalBudget) * 100;

  const handlePause = async () => {
    if (!isOnChain) return;
    try {
      await pauseSubAccount(account.id);
    } catch (e) {
      console.error("Failed to pause:", e);
    }
  };

  const handleResume = async () => {
    if (!isOnChain) return;
    try {
      await resumeSubAccount(account.id);
    } catch (e) {
      console.error("Failed to resume:", e);
    }
  };

  return (
    <div>
      <Link
        href="/dashboard/accounts"
        className="text-[13px] text-neutral-500 transition-colors hover:text-white"
      >
        ← back
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-semibold ${
              account.status === "active"
                ? "bg-[var(--accent)]/[0.12] text-[var(--accent)]"
                : account.status === "paused"
                  ? "bg-amber-400/[0.12] text-amber-400"
                  : "bg-neutral-700/[0.3] text-neutral-600"
            }`}
          >
            {account.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[clamp(22px,2vw,28px)] font-bold tracking-[-0.03em]">
                {account.name}
              </h1>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  account.status === "active"
                    ? "text-[var(--accent)] bg-[var(--accent)]/[0.10]"
                    : account.status === "paused"
                      ? "text-amber-400 bg-amber-400/[0.10]"
                      : "text-neutral-600 bg-neutral-600/[0.10]"
                }`}
              >
                {account.status}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-neutral-600">
              {account.agentId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOnChain && (
            <button
              onClick={() => setShowFund(!showFund)}
              className="btn-primary text-[13px]"
            >
              fund this agent
            </button>
          )}
          {account.status === "active" && (
            <button
              onClick={handlePause}
              className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] text-amber-400 transition-colors hover:border-amber-400/30 hover:bg-amber-400/[0.05]"
            >
              pause
            </button>
          )}
          {account.status === "paused" && (
            <button
              onClick={handleResume}
              className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] text-[var(--accent)] transition-colors hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/[0.05]"
            >
              resume
            </button>
          )}
          <button className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] text-red-400 transition-colors hover:border-red-400/30 hover:bg-red-400/[0.05]">
            close
          </button>
        </div>
      </div>

      {/* Fund this agent modal */}
      {showFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="liquid-glass rounded-2xl p-7 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold tracking-tight">fund this agent</h3>
              <button onClick={() => { setShowFund(false); setFundError(""); }} className="text-neutral-600 hover:text-white transition-colors text-[18px]">×</button>
            </div>
            <p className="text-[12px] text-neutral-500 mb-4">
              USDC will be sent from your <strong className="text-white">Phantom wallet</strong> directly into <strong className="text-white">{account.name}</strong>&apos;s balance on-chain.
            </p>
            <div className="flex items-start gap-2 rounded-xl bg-[var(--accent)]/[0.06] border border-[var(--accent)]/[0.12] px-4 py-3 mb-4">
              <span className="text-[var(--accent)] text-[13px] mt-0.5">◈</span>
              <p className="text-[11px] text-[var(--accent)]/80 leading-relaxed">
                you need USDC in your connected Phantom wallet. don&apos;t have any?{" "}
                <a href="https://jup.ag/swap/SOL-USDC" target="_blank" rel="noopener noreferrer" className="underline">
                  buy on Jupiter ↗
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 mb-4">
              <span className="text-[13px] text-neutral-500">$</span>
              <input
                type="number" placeholder="0.00"
                value={fundAmount} onChange={(e) => setFundAmount(e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder-neutral-700 num"
                min="0" step="0.01"
              />
              <span className="text-[11px] text-neutral-600">USDC</span>
            </div>
            {fundError && <p className="text-[11px] text-red-400 mb-3">{fundError}</p>}
            <button
              onClick={() => handleFund(account.id)}
              disabled={fundLoading || !fundAmount}
              className="w-full btn-primary text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {fundLoading ? "confirming..." : "fund agent"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="balance"
          value={`$${account.balance.toLocaleString()}`}
          sub={`of $${account.totalBudget.toLocaleString()} budget`}
          accent
        />
        <StatCard
          label="total spent"
          value={`$${account.spent.toLocaleString()}`}
          sub={`${pct.toFixed(1)}% of budget`}
        />
        <StatCard
          label="transactions"
          value={account.txCount.toString()}
          sub={`last active ${account.lastActive}`}
        />
        <StatCard
          label="whitelisted"
          value={account.whitelistCount.toString()}
          sub="services"
        />
      </div>

      <div className="mt-6 liquid-glass rounded-2xl p-5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-500">budget usage</span>
          <span className="text-white num">
            ${account.spent.toLocaleString()} / $
            {account.totalBudget.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all ${
              pct > 90
                ? "bg-red-400"
                : pct > 70
                  ? "bg-amber-400"
                  : "bg-[var(--accent)]"
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="liquid-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] text-neutral-600 uppercase tracking-[0.12em]">
              spending rules
            </h3>
            {isOnChain && (
              <button
                onClick={() => setShowRules(!showRules)}
                className="text-[11px] text-[var(--accent)] hover:underline transition-colors"
              >
                {showRules ? "cancel" : "edit"}
              </button>
            )}
          </div>

          {showRules && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
                <span className="text-[12px] text-neutral-500 w-28 shrink-0">max per tx ($)</span>
                <input
                  type="number" placeholder="e.g. 50"
                  value={maxPerTx} onChange={(e) => setMaxPerTx(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder-neutral-700 num"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
                <span className="text-[12px] text-neutral-500 w-28 shrink-0">max per day ($)</span>
                <input
                  type="number" placeholder="e.g. 500"
                  value={maxPerDay} onChange={(e) => setMaxPerDay(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder-neutral-700 num"
                />
              </div>
              {rulesError && <p className="text-[11px] text-red-400">{rulesError}</p>}
              <button
                onClick={() => handleSetRules(account.id)}
                disabled={rulesLoading || !maxPerTx || !maxPerDay}
                className="w-full btn-primary text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {rulesLoading ? "saving..." : "save rules"}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {[
              { label: "max per transaction", value: account.maxPerTx === -1 ? "unlimited" : `$${account.maxPerTx}` },
              { label: "max per hour", value: account.maxPerHour === -1 ? "unlimited" : `$${account.maxPerHour}` },
              { label: "max per day", value: account.maxPerDay === -1 ? "unlimited" : `$${account.maxPerDay}` },
              ...(account.timeWindowStart && account.timeWindowEnd
                ? [{ label: "time window", value: `${account.timeWindowStart} – ${account.timeWindowEnd} UTC` }]
                : []),
            ].map((rule) => (
              <div key={rule.label} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                <span className="text-[13px] text-neutral-500">{rule.label}</span>
                <span className="text-[13px] text-white num">{rule.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] text-neutral-600 uppercase tracking-[0.12em]">
              whitelist
            </h3>
            {isOnChain && (
              <button
                onClick={() => setShowWhitelist(!showWhitelist)}
                className="text-[11px] text-[var(--accent)] hover:underline transition-colors"
              >
                {showWhitelist ? "cancel" : "+ add"}
              </button>
            )}
          </div>

          {showWhitelist && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
                <span className="text-[12px] text-neutral-500 w-16 shrink-0">address</span>
                <input
                  type="text" placeholder="Solana address"
                  value={whitelistAddr} onChange={(e) => setWhitelistAddr(e.target.value)}
                  className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-neutral-700 font-mono"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
                <span className="text-[12px] text-neutral-500 w-16 shrink-0">label</span>
                <input
                  type="text" placeholder="e.g. OpenAI API"
                  value={whitelistLabel} onChange={(e) => setWhitelistLabel(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder-neutral-700"
                />
              </div>
              {whitelistError && <p className="text-[11px] text-red-400">{whitelistError}</p>}
              <button
                onClick={() => handleAddWhitelist(account.id)}
                disabled={whitelistLoading || !whitelistAddr || !whitelistLabel}
                className="w-full btn-primary text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {whitelistLoading ? "adding..." : "add to whitelist"}
              </button>
            </div>
          )}

          {(() => {
            const entries = whitelistMap[account.id] ?? [];
            if (entries.length === 0) {
              return <p className="text-[13px] text-neutral-600">no whitelisted addresses yet.</p>;
            }
            return (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry.address} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                    <div>
                      <p className="text-[13px] text-white">{entry.label}</p>
                      <p className="text-[11px] text-neutral-600 font-mono mt-0.5 truncate max-w-[200px]">{entry.address}</p>
                    </div>
                    <button
                      onClick={async () => {
                        try { await removeFromWhitelist(account.id, entry.address); } catch { /* ignored */ }
                      }}
                      className="text-[11px] text-neutral-600 hover:text-red-400 transition-colors shrink-0 ml-3"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-4">
          transactions
        </h3>
        {accountTxs.length > 0 ? (
          <div className="liquid-glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
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
                    sig
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                    time
                  </th>
                </tr>
              </thead>
              <tbody>
                {accountTxs.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`transition-colors hover:bg-white/[0.02] ${
                      i < accountTxs.length - 1
                        ? "border-b border-white/[0.04]"
                        : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <span className="text-[13px]">{tx.toLabel}</span>
                      <span className="text-[11px] text-neutral-700 ml-2">
                        {tx.to}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] num">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          tx.status === "confirmed"
                            ? "text-[var(--accent)] bg-[var(--accent)]/[0.10]"
                            : tx.status === "pending"
                              ? "text-amber-400 bg-amber-400/[0.10]"
                              : "text-red-400 bg-red-400/[0.10]"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`https://solscan.io/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-neutral-600 hover:text-[var(--accent)] transition-colors font-mono"
                      >
                        {tx.signature.slice(0, 4)}...{tx.signature.slice(-4)} ↗
                      </a>
                    </td>
                    <td className="px-5 py-3 text-right text-[11px] text-neutral-600">
                      {tx.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="liquid-glass rounded-2xl p-8 text-center">
            <p className="text-[13px] text-neutral-600">
              no transactions yet.
            </p>
          </div>
        )}
      </div>

      {/* Give this to your agent */}
      <div className="mt-8">
        <div className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[var(--accent)] text-[16px]">◈</span>
            <h3 className="text-[14px] font-semibold tracking-tight">give this to your agent</h3>
          </div>
          <p className="text-[12px] text-neutral-500 mb-5 ml-7">
            paste these values into your agent. it will be able to transact autonomously within the rules you set.
          </p>

          <div className="space-y-2">
            {[
              { label: "PROGRAM_ID", value: "2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx" },
              { label: "SUB_ACCOUNT", value: account.id },
              { label: "NETWORK", value: "mainnet-beta" },
              { label: "RPC_URL", value: "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                <span className="text-[11px] text-neutral-600 w-32 shrink-0 uppercase tracking-[0.08em]">{label}</span>
                <span className="flex-1 text-[12px] text-white font-mono truncate">{value}</span>
                <button
                  onClick={() => copyToClipboard(value, label)}
                  className="text-[11px] text-neutral-600 hover:text-[var(--accent)] transition-colors shrink-0"
                >
                  {copied === label ? "copied ✓" : "copy"}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-neutral-600 uppercase tracking-[0.08em]">agent config</span>
              <button
                onClick={() => copyToClipboard(
                  `PROGRAM_ID=2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx\nSUB_ACCOUNT=${account.id}\nNETWORK=mainnet-beta\nRPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`,
                  "config"
                )}
                className="text-[11px] text-neutral-600 hover:text-[var(--accent)] transition-colors"
              >
                {copied === "config" ? "copied ✓" : "copy all"}
              </button>
            </div>
            <pre className="text-[11px] text-neutral-400 font-mono leading-relaxed overflow-x-auto">{`PROGRAM_ID=2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx\nSUB_ACCOUNT=${account.id}\nNETWORK=mainnet-beta\nRPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`}</pre>
          </div>

          <p className="mt-4 text-[11px] text-neutral-600">
            the agent also needs a funded Solana keypair (~0.01 SOL) to pay transaction fees. funds come from this sub-account, not the agent wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
