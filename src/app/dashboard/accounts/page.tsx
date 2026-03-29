"use client";

import Link from "next/link";
import { useVault } from "@/lib/useVault";

export default function AccountsPage() {
  const { subAccounts, isOnChain } = useVault();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(22px,2vw,28px)] font-bold tracking-[-0.03em]">
            sub-accounts
          </h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            manage agent sub-accounts and spending rules.
          </p>
        </div>
        <Link
          href="/dashboard/accounts/new"
          className="text-black bg-[var(--accent)] rounded-xl px-4 py-2.5 text-[13px] font-medium hover:brightness-110 transition"
        >
          + new
        </Link>
      </div>

      {subAccounts.length === 0 ? (
        <div className="mt-6 liquid-glass rounded-2xl p-12 text-center">
          <p className="text-[13px] text-neutral-600">
            {isOnChain
              ? "no sub-accounts yet. create one to get started."
              : "connect your wallet and deploy a vault first."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {subAccounts.map((account) => {
            const pct = (account.spent / account.totalBudget) * 100;
            const initial = account.name.charAt(0).toUpperCase();

            return (
              <Link
                key={account.id}
                href={`/dashboard/accounts/${account.id}`}
                className="group liquid-glass rounded-2xl p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between">
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
                      {initial}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold tracking-tight text-white">
                          {account.name}
                        </span>
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
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        {account.agentId}
                      </p>
                    </div>
                  </div>
                  <span className="text-neutral-700 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-500">
                    →
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-neutral-500">budget used</span>
                    <span className="text-white num">
                      ${account.spent.toLocaleString()} / $
                      {account.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full rounded-full bg-white/[0.06]">
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

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-[0.12em]">
                      balance
                    </p>
                    <p className="text-[13px] text-white num mt-0.5">
                      ${account.balance.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-[0.12em]">
                      max/tx
                    </p>
                    <p className="text-[13px] text-white num mt-0.5">
                      {account.maxPerTx === -1 ? "∞" : `$${account.maxPerTx}`}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-[0.12em]">
                      max/day
                    </p>
                    <p className="text-[13px] text-white num mt-0.5">
                      {account.maxPerDay === -1 ? "∞" : `$${account.maxPerDay}`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-[11px] text-neutral-600">
                  <span>{account.whitelistCount} whitelisted</span>
                  <span>{account.lastActive}</span>
                  {account.autoTopUp && (
                    <span className="text-neutral-500">auto top-up</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
