"use client";

import { useVault } from "@/lib/useVault";

export default function TransactionsPage() {
  const { transactions } = useVault();

  return (
    <div>
      <div>
        <h1 className="text-[clamp(22px,2vw,28px)] font-bold tracking-[-0.03em]">
          transactions
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          on-chain audit trail. every payment logged.
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="mt-6 liquid-glass rounded-2xl p-12 text-center">
          <p className="text-[13px] text-neutral-600">
            no transactions yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 liquid-glass rounded-2xl overflow-hidden">
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
                  signature
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                  time
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr
                  key={tx.id}
                  className={`transition-colors hover:bg-white/[0.02] ${
                    i < transactions.length - 1
                      ? "border-b border-white/[0.04]"
                      : ""
                  }`}
                >
                  <td className="px-5 py-3 text-[13px]">
                    {tx.subAccountName}
                  </td>
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
                            ? "text-amber-400 bg-amber-400/10"
                            : "text-red-400 bg-red-400/10"
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
      )}
    </div>
  );
}
