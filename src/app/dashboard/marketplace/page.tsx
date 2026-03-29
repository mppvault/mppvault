"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCatalog } from "@/lib/catalog";
import type { AgentCatalogEntry } from "@/lib/catalog";
import { fetchRegistry } from "@/lib/registry";
import type { RegistryAgent } from "@/lib/registry";

type MarketplaceAgent = AgentCatalogEntry & {
  onChain?: RegistryAgent;
};

const CATEGORIES = [
  { id: "all", label: "All Agents", icon: "◆" },
  { id: "text-generation", label: "Text Generation", icon: "✦" },
  { id: "code-generation", label: "Code Generation", icon: "⟨⟩" },
  { id: "image-generation", label: "Image Generation", icon: "◐" },
  { id: "web-search", label: "Web Search", icon: "◎" },
  { id: "data-analysis", label: "Data Analysis", icon: "▤" },
  { id: "translation", label: "Translation", icon: "⇄" },
  { id: "summarization", label: "Summarization", icon: "≡" },
  { id: "embedding", label: "Embedding", icon: "⬡" },
  { id: "reasoning", label: "Reasoning", icon: "◈" },
  { id: "tool-use", label: "Tool Use", icon: "⚙" },
];

function TrustBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-[var(--accent)] bg-[var(--accent)]/[0.10]"
      : score >= 40
        ? "text-amber-400 bg-amber-400/[0.10]"
        : "text-neutral-500 bg-neutral-500/[0.10]";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${color}`}>
      {score}/100
    </span>
  );
}

export default function MarketplacePage() {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"trust" | "price-low" | "price-high" | "volume">("trust");

  useEffect(() => {
    Promise.all([fetchCatalog(), fetchRegistry()])
      .then(([catalogEntries, { agents: registryAgents }]) => {
        const registryMap = new Map(
          registryAgents.map((a) => [a.subAccountAddress, a]),
        );

        const merged: MarketplaceAgent[] = catalogEntries.map((entry) => ({
          ...entry,
          onChain: registryMap.get(entry.subAccountAddress),
        }));

        setAgents(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents
    .filter((a) => {
      if (category !== "all" && !a.capabilities.includes(category)) return false;
      const q = search.toLowerCase();
      if (q && !a.agentName.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q) && !a.capabilities.some((c) => c.includes(q))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "trust") return (b.onChain?.trustScore ?? 0) - (a.onChain?.trustScore ?? 0);
      if (sortBy === "volume") return (b.onChain?.spent ?? 0) - (a.onChain?.spent ?? 0);
      if (sortBy === "price-low") {
        const aMin = Math.min(...a.rateCards.map((r) => r.priceUsdc), Infinity);
        const bMin = Math.min(...b.rateCards.map((r) => r.priceUsdc), Infinity);
        return aMin - bMin;
      }
      if (sortBy === "price-high") {
        const aMax = Math.max(...a.rateCards.map((r) => r.priceUsdc), 0);
        const bMax = Math.max(...b.rateCards.map((r) => r.priceUsdc), 0);
        return bMax - aMax;
      }
      return 0;
    });

  const totalAgents = agents.length;
  const totalCapabilities = new Set(agents.flatMap((a) => a.capabilities)).size;
  const totalVolume = agents.reduce((sum, a) => sum + (a.onChain?.spent ?? 0), 0);
  const avgTrust = agents.length > 0 ? Math.round(agents.reduce((sum, a) => sum + (a.onChain?.trustScore ?? 0), 0) / agents.length) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[var(--accent)] text-[20px]">◆</span>
          <h1 className="text-[clamp(24px,2.5vw,32px)] font-bold tracking-[-0.03em]">
            agent marketplace
          </h1>
        </div>
        <p className="text-[13px] text-neutral-500 leading-[1.7] max-w-[520px]">
          discover AI agents, compare capabilities and pricing, and integrate them into your workflow. all payments settle on-chain via MPP Vault.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        <div className="liquid-glass rounded-2xl p-4">
          <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">agents listed</span>
          <p className="text-[22px] num font-bold text-white leading-none mt-1">{totalAgents}</p>
        </div>
        <div className="liquid-glass rounded-2xl p-4">
          <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">capabilities</span>
          <p className="text-[22px] num font-bold text-white leading-none mt-1">{totalCapabilities}</p>
        </div>
        <div className="liquid-glass rounded-2xl p-4">
          <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">volume (USDC)</span>
          <p className="text-[22px] num font-bold text-[var(--accent)] leading-none mt-1">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="liquid-glass rounded-2xl p-4">
          <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">avg trust</span>
          <p className="text-[22px] num font-bold text-white leading-none mt-1">{avgTrust}/100</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 text-[14px]">⌕</span>
          <input
            type="text"
            placeholder="search agents, capabilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-neutral-600 outline-none focus:border-[var(--accent)]/30 transition-colors"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none cursor-pointer"
        >
          <option value="trust">sort: trust score</option>
          <option value="volume">sort: volume</option>
          <option value="price-low">sort: price (low)</option>
          <option value="price-high">sort: price (high)</option>
        </select>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full transition-all ${
              category === cat.id
                ? "bg-[var(--accent)]/[0.12] text-[var(--accent)] border border-[var(--accent)]/30"
                : "bg-white/[0.04] text-neutral-500 border border-white/[0.06] hover:text-white hover:border-white/[0.12]"
            }`}
          >
            <span className="text-[11px]">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="liquid-glass rounded-2xl p-12 text-center">
          <p className="text-[14px] text-neutral-500">loading marketplace...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="liquid-glass rounded-2xl p-12 text-center">
          <span className="text-[32px] mb-4 block">◆</span>
          <p className="text-[20px] font-bold tracking-tight mb-2">
            {agents.length === 0 ? "no agents listed yet" : "no agents match your search"}
          </p>
          <p className="text-[13px] text-neutral-500 mb-6 max-w-sm mx-auto">
            {agents.length === 0
              ? "be the first to register your agent's capabilities. go to your sub-account and register in the capability catalog."
              : "try a different search term or category."}
          </p>
          {agents.length === 0 && (
            <Link href="/dashboard/accounts" className="btn-primary text-[13px]">
              register your agent
            </Link>
          )}
        </div>
      )}

      {/* Agent grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((agent) => (
            <Link
              key={agent.subAccountAddress}
              href={`/dashboard/marketplace/${agent.subAccountAddress}`}
              className="liquid-glass rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--accent)]/20 transition-all group block"
            >
              {/* Top */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/[0.12] flex items-center justify-center text-[var(--accent)] text-[14px] font-bold">
                      {agent.agentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-white leading-tight group-hover:text-[var(--accent)] transition-colors">
                        {agent.agentName}
                      </p>
                      <p className="text-[11px] text-neutral-600 font-mono">{agent.agentId || agent.subAccountAddress.slice(0, 12) + "..."}</p>
                    </div>
                  </div>
                  {agent.onChain && <TrustBadge score={agent.onChain.trustScore} />}
                </div>

                {/* Description */}
                {agent.description && (
                  <p className="text-[13px] text-neutral-400 leading-[1.6] mb-3 line-clamp-2">
                    {agent.description}
                  </p>
                )}

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.capabilities.slice(0, 5).map((cap) => (
                    <span key={cap} className="text-[10px] text-[var(--accent)] bg-[var(--accent)]/[0.08] px-2 py-0.5 rounded-full">
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 5 && (
                    <span className="text-[10px] text-neutral-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                      +{agent.capabilities.length - 5} more
                    </span>
                  )}
                </div>

                {/* Rate cards preview */}
                {agent.rateCards.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {agent.rateCards.slice(0, 3).map((rc) => (
                      <div key={rc.capability} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-1.5">
                        <span className="text-[11px] text-neutral-400">{rc.capability}</span>
                        <span className="text-[11px] text-white num font-medium">${rc.priceUsdc} <span className="text-neutral-600">/ {rc.unit}</span></span>
                      </div>
                    ))}
                    {agent.rateCards.length > 3 && (
                      <p className="text-[10px] text-neutral-600 text-center">+{agent.rateCards.length - 3} more rates</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-4">
                  {agent.onChain && (
                    <>
                      <div className="text-center">
                        <p className="text-[11px] num font-medium text-white">{agent.onChain.txCount}</p>
                        <p className="text-[9px] text-neutral-600">txns</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] num font-medium text-white">${agent.onChain.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <p className="text-[9px] text-neutral-600">volume</p>
                      </div>
                    </>
                  )}
                  <div className="text-center">
                    <p className="text-[11px] num font-medium text-white">{agent.sla.uptimePercent}%</p>
                    <p className="text-[9px] text-neutral-600">uptime</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] num font-medium text-white">{agent.sla.avgResponseMs}ms</p>
                    <p className="text-[9px] text-neutral-600">latency</p>
                  </div>
                </div>
                <span className="text-[11px] text-neutral-600 group-hover:text-[var(--accent)] transition-colors">
                  view →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-10 liquid-glass rounded-2xl p-6 text-center">
        <h3 className="text-[16px] font-semibold tracking-tight mb-2">
          list your agent<span className="text-[var(--accent)]">.</span>
        </h3>
        <p className="text-[13px] text-neutral-500 mb-4 max-w-sm mx-auto leading-[1.7]">
          register your agent&apos;s capabilities and let the ecosystem discover you. go to your sub-account and open the capability catalog.
        </p>
        <Link href="/dashboard/accounts" className="btn-primary text-[13px]">
          go to sub-accounts
        </Link>
      </div>
    </div>
  );
}
