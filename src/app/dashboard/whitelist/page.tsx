"use client";

import { useVault } from "@/lib/useVault";

export default function WhitelistPage() {
  const { whitelist } = useVault();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(22px,2vw,28px)] font-bold tracking-[-0.03em]">
            whitelist
          </h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            approved service addresses. agents can only pay these.
          </p>
        </div>
        <button className="text-black bg-[var(--accent)] rounded-xl px-4 py-2.5 text-[13px] font-medium hover:brightness-110 transition">
          + add address
        </button>
      </div>

      {whitelist.length === 0 ? (
        <div className="mt-6 liquid-glass rounded-2xl p-12 text-center">
          <p className="text-[13px] text-neutral-600">
            no whitelisted addresses yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 liquid-glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                  label
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                  address
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]">
                  added
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-medium text-neutral-600 uppercase tracking-[0.1em]" />
              </tr>
            </thead>
            <tbody>
              {whitelist.map((entry, i) => (
                <tr
                  key={entry.address}
                  className={`transition-colors hover:bg-white/[0.02] ${
                    i < whitelist.length - 1
                      ? "border-b border-white/[0.04]"
                      : ""
                  }`}
                >
                  <td className="px-5 py-3 text-[13px]">{entry.label}</td>
                  <td className="px-5 py-3 text-[13px] text-neutral-500">
                    {entry.address}
                  </td>
                  <td className="px-5 py-3 text-right text-[11px] text-neutral-600">
                    {entry.addedAt}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-[11px] text-neutral-600 transition-colors hover:text-red-400">
                      remove
                    </button>
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
