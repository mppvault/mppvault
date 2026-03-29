"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { fetchRegistry } from "@/lib/registry";
import type { RegistryAgent, RegistryStats } from "@/lib/registry";
import { fetchCatalog } from "@/lib/catalog";
import type { AgentCatalogEntry } from "@/lib/catalog";
import { ALL_CAPABILITIES } from "@/lib/catalog";

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

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active"
      ? "text-[var(--accent)]"
      : status === "paused"
        ? "text-amber-400"
        : "text-neutral-600";
  return <span className={`text-[10px] ${color}`}>●</span>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="liquid-glass rounded-2xl p-5 flex flex-col justify-between min-h-[100px]">
      <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">{label}</span>
      <span className="text-[28px] num font-bold text-white leading-none mt-2">{value}</span>
    </div>
  );
}

function CapabilityPill({ cap, active, onClick }: { cap: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-3 py-1 rounded-full transition-all ${
        active
          ? "bg-[var(--accent)]/[0.15] text-[var(--accent)] border border-[var(--accent)]/30"
          : "bg-white/[0.04] text-neutral-500 border border-white/[0.06] hover:text-white hover:border-white/[0.12]"
      }`}
    >
      {cap}
    </button>
  );
}

type MergedAgent = RegistryAgent & { catalog?: AgentCatalogEntry };

export default function RegistryPage() {
  const [agents, setAgents] = useState<RegistryAgent[]>([]);
  const [catalog, setCatalog] = useState<AgentCatalogEntry[]>([]);
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [search, setSearch] = useState("");
  const [capFilter, setCapFilter] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchRegistry(), fetchCatalog()])
      .then(([{ agents, stats }, catalogEntries]) => {
        setAgents(agents);
        setStats(stats);
        setCatalog(catalogEntries);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const catalogMap = new Map(catalog.map((c) => [c.subAccountAddress, c]));

  const merged: MergedAgent[] = agents.map((a) => ({
    ...a,
    catalog: catalogMap.get(a.subAccountAddress),
  }));

  const activeCaps = Array.from(
    new Set(catalog.flatMap((c) => c.capabilities)),
  ).sort();

  const filtered = merged.filter((a) => {
    if (filter === "active" && a.status !== "active") return false;
    if (filter === "paused" && a.status !== "paused") return false;
    const q = search.toLowerCase();
    if (q && !a.agentName.toLowerCase().includes(q) && !a.agentId.toLowerCase().includes(q) && !a.subAccountAddress.toLowerCase().includes(q)) return false;
    if (capFilter && !a.catalog?.capabilities.some((c) => c === capFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 lg:pt-36 lg:pb-32">

        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] text-[var(--accent)] uppercase tracking-[0.18em] font-medium mb-4">
            agent registry
          </p>
          <h1 className="text-[clamp(32px,4vw,52px)] font-bold tracking-[-0.04em] leading-[1.05]">
            on-chain agent directory<span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-[15px] text-neutral-500 leading-[1.7] mt-5 max-w-[600px]">
            Every agent running through MPP Vault is visible here. Spending history, trust scores, capabilities, rate cards, and endpoints — all verified. Nothing self-reported.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-12">
            <StatBox label="vaults" value={stats.totalVaults.toString()} />
            <StatBox label="agents" value={stats.totalAgents.toString()} />
            <StatBox label="active" value={stats.activeAgents.toString()} />
            <StatBox label="volume (USDC)" value={`$${stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            <StatBox label="transactions" value={stats.totalTransactions.toString()} />
          </div>
        )}

        {/* Capability filter pills */}
        {activeCaps.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-3">filter by capability</p>
            <div className="flex flex-wrap gap-2">
              <CapabilityPill
                cap="all"
                active={capFilter === null}
                onClick={() => setCapFilter(null)}
              />
              {activeCaps.map((cap) => (
                <CapabilityPill
                  key={cap}
                  cap={cap}
                  active={capFilter === cap}
                  onClick={() => setCapFilter(capFilter === cap ? null : cap)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1">
            {(["all", "active", "paused"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[12px] px-3 py-1.5 rounded-full transition-all ${
                  filter === f
                    ? "bg-white/[0.08] text-white"
                    : "text-neutral-600 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-[13px] text-white placeholder:text-neutral-600 w-full sm:w-64 outline-none focus:border-[var(--accent)]/30 transition-colors"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="liquid-glass rounded-2xl p-12 text-center">
            <p className="text-[14px] text-neutral-500">scanning on-chain accounts...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="liquid-glass rounded-2xl p-12 text-center">
            <p className="text-[20px] font-bold tracking-tight mb-2">no agents found</p>
            <p className="text-[13px] text-neutral-500 mb-6">
              {agents.length === 0
                ? "No agents have been registered on MPP Vault yet. Be the first."
                : "No agents match your filter."}
            </p>
            {agents.length === 0 && (
              <Link href="/dashboard" className="btn-primary text-[13px]">
                deploy a vault
              </Link>
            )}
          </div>
        )}

        {/* Agent Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map((agent) => (
              <div
                key={agent.subAccountAddress}
                className="liquid-glass rounded-2xl p-6 flex flex-col justify-between hover:border-white/[0.12] transition-all group cursor-pointer"
                onClick={() => setExpandedAgent(expandedAgent === agent.subAccountAddress ? null : agent.subAccountAddress)}
              >
                {/* Top row */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/[0.12] flex items-center justify-center text-[var(--accent)] text-[12px] font-bold">
                        {agent.agentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white leading-tight">{agent.agentName}</p>
                        <p className="text-[11px] text-neutral-600 font-mono">{agent.agentId || "no-id"}</p>
                      </div>
                    </div>
                    <TrustBadge score={agent.trustScore} />
                  </div>

                  {/* Address */}
                  <p className="text-[10px] text-neutral-700 font-mono mb-3">
                    {agent.subAccountAddress.slice(0, 8)}...{agent.subAccountAddress.slice(-8)}
                  </p>

                  {/* Capabilities */}
                  {agent.catalog && agent.catalog.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {agent.catalog.capabilities.map((cap) => (
                        <span key={cap} className="text-[10px] text-[var(--accent)] bg-[var(--accent)]/[0.08] px-2 py-0.5 rounded-full">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase tracking-wider">spent</span>
                      <p className="text-[14px] num font-medium text-white">${agent.spent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase tracking-wider">balance</span>
                      <p className="text-[14px] num font-medium text-white">${agent.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase tracking-wider">transactions</span>
                      <p className="text-[14px] num font-medium text-white">{agent.txCount}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase tracking-wider">budget</span>
                      <p className="text-[14px] num font-medium text-white">${agent.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded: Rate cards + endpoint + SLA */}
                {expandedAgent === agent.subAccountAddress && agent.catalog && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                    {/* Endpoint */}
                    {agent.catalog.endpoint && (
                      <div>
                        <span className="text-[10px] text-neutral-600 uppercase tracking-wider">endpoint</span>
                        <p className="text-[12px] text-[var(--accent)] font-mono mt-0.5 truncate">{agent.catalog.endpoint}</p>
                      </div>
                    )}

                    {/* Description */}
                    {agent.catalog.description && (
                      <div>
                        <span className="text-[10px] text-neutral-600 uppercase tracking-wider">description</span>
                        <p className="text-[12px] text-neutral-400 mt-0.5">{agent.catalog.description}</p>
                      </div>
                    )}

                    {/* Rate Cards */}
                    {agent.catalog.rateCards.length > 0 && (
                      <div>
                        <span className="text-[10px] text-neutral-600 uppercase tracking-wider">rate cards</span>
                        <div className="space-y-1 mt-1">
                          {agent.catalog.rateCards.map((rc) => (
                            <div key={rc.capability} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                              <span className="text-[12px] text-neutral-400">{rc.capability}</span>
                              <span className="text-[12px] text-white num font-medium">${rc.priceUsdc} / {rc.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SLA */}
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase tracking-wider">sla</span>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2 text-center">
                          <p className="text-[11px] text-white num font-medium">{agent.catalog.sla.uptimePercent}%</p>
                          <p className="text-[9px] text-neutral-600">uptime</p>
                        </div>
                        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2 text-center">
                          <p className="text-[11px] text-white num font-medium">{agent.catalog.sla.avgResponseMs}ms</p>
                          <p className="text-[9px] text-neutral-600">avg</p>
                        </div>
                        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2 text-center">
                          <p className="text-[11px] text-white num font-medium">{agent.catalog.sla.maxResponseMs}ms</p>
                          <p className="text-[9px] text-neutral-600">max</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={agent.status} />
                      <span className="text-[11px] text-neutral-500">{agent.status}</span>
                    </div>
                    {agent.maxPerTx >= 0 && agent.maxPerTx < 1_000_000 && (
                      <span className="text-[10px] text-neutral-600 bg-white/[0.04] px-2 py-0.5 rounded-full">
                        limit: ${agent.maxPerTx.toLocaleString()}/tx
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.catalog && (
                      <span className="text-[10px] text-[var(--accent)] bg-[var(--accent)]/[0.06] px-2 py-0.5 rounded-full">
                        catalog
                      </span>
                    )}
                    <a
                      href={`https://solscan.io/account/${agent.subAccountAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-neutral-600 hover:text-[var(--accent)] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      solscan →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom info */}
        <div className="mt-16 liquid-glass rounded-2xl p-8 text-center">
          <p className="text-[11px] text-neutral-600 uppercase tracking-[0.15em] mb-3">100% on-chain data + capability catalog</p>
          <h3 className="text-[20px] font-bold tracking-tight mb-3">
            every number is verified on solana<span className="text-[var(--accent)]">.</span>
          </h3>
          <p className="text-[13px] text-neutral-500 mb-6 max-w-md mx-auto leading-[1.7]">
            Trust scores are computed from real on-chain activity. Capabilities, rate cards, and endpoints are registered through the catalog API. Agents can discover and pay each other programmatically.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/dashboard" className="btn-primary text-[13px]">
              register your agent
            </Link>
            <a
              href="https://github.com/mppvault/mppvault"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] text-neutral-400 hover:text-white hover:border-white/20 transition-all"
            >
              view source
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
