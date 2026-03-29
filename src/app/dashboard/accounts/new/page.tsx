"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVault } from "@/lib/useVault";

export default function NewAccountPage() {
  const router = useRouter();
  const { createSubAccount, isOnChain } = useVault();
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !agentId || !budget) return;

    setLoading(true);
    setError("");

    try {
      await createSubAccount(name, agentId, parseFloat(budget));
      router.push("/dashboard/accounts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "transaction failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOnChain) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-[15px] text-neutral-500">
          deploy a vault first before creating sub-accounts.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 text-[13px] text-[var(--accent)] hover:underline"
        >
          ← back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/accounts"
        className="text-[13px] text-neutral-500 transition-colors hover:text-white"
      >
        ← back
      </Link>

      <h1 className="mt-4 text-[clamp(22px,2vw,28px)] font-bold tracking-[-0.03em]">
        new sub-account
      </h1>
      <p className="mt-1 text-[13px] text-neutral-500">
        create a new agent sub-account with a spending budget.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
        <div>
          <label className="block text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-2">
            name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Research Agent"
            maxLength={32}
            className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[13px] text-white placeholder:text-neutral-700 outline-none transition-colors focus:border-[var(--accent)]/30"
          />
        </div>

        <div>
          <label className="block text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-2">
            agent id
          </label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="e.g. agent_research_01"
            maxLength={64}
            className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[13px] text-white placeholder:text-neutral-700 outline-none transition-colors focus:border-[var(--accent)]/30"
          />
        </div>

        <div>
          <label className="block text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-2">
            total budget (USDC)
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 5000"
            min="0"
            step="0.01"
            className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[13px] text-white placeholder:text-neutral-700 outline-none transition-colors focus:border-[var(--accent)]/30"
          />
        </div>

        {error && (
          <p className="text-[12px] text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !name || !agentId || !budget}
          className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "creating..." : "create sub-account"}
        </button>
      </form>
    </div>
  );
}
