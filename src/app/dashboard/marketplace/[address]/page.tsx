"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchAgentCatalog } from "@/lib/catalog";
import type { AgentCatalogEntry } from "@/lib/catalog";
import { fetchRegistry } from "@/lib/registry";
import type { RegistryAgent } from "@/lib/registry";

function TrustBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-[var(--accent)] bg-[var(--accent)]/[0.10]"
      : score >= 40
        ? "text-amber-400 bg-amber-400/[0.10]"
        : "text-neutral-500 bg-neutral-500/[0.10]";
  return (
    <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${color}`}>
      trust {score}/100
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "active"
      ? "bg-[var(--accent)]"
      : status === "paused"
        ? "bg-amber-400"
        : "bg-neutral-600";
  return <span className={`w-2 h-2 rounded-full ${color}`} />;
}

export default function AgentProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const [catalog, setCatalog] = useState<AgentCatalogEntry | null>(null);
  const [onChain, setOnChain] = useState<RegistryAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAgentCatalog(address),
      fetchRegistry().then(({ agents }) =>
        agents.find((a) => a.subAccountAddress === address) ?? null,
      ),
    ])
      .then(([catalogEntry, registryAgent]) => {
        setCatalog(catalogEntry);
        setOnChain(registryAgent);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-[14px] text-neutral-500">loading agent profile...</p>
      </div>
    );
  }

  if (!catalog && !onChain) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <span className="text-[32px] mb-4">◆</span>
        <p className="text-[18px] font-bold tracking-tight mb-2">agent not found</p>
        <p className="text-[13px] text-neutral-500 mb-6">
          this agent is not listed in the marketplace.
        </p>
        <Link href="/dashboard/marketplace" className="text-[13px] text-[var(--accent)] hover:underline">
          ← back to marketplace
        </Link>
      </div>
    );
  }

  const name = catalog?.agentName ?? onChain?.agentName ?? "Unknown Agent";
  const agentId = catalog?.agentId ?? onChain?.agentId ?? "";
  const description = catalog?.description ?? "";
  const capabilities = catalog?.capabilities ?? [];
  const rateCards = catalog?.rateCards ?? [];
  const sla = catalog?.sla ?? { uptimePercent: 0, avgResponseMs: 0, maxResponseMs: 0 };
  const endpoint = catalog?.endpoint ?? "";

  return (
    <div>
      <Link
        href="/dashboard/marketplace"
        className="text-[13px] text-neutral-500 transition-colors hover:text-white"
      >
        ← marketplace
      </Link>

      {/* Hero */}
      <div className="mt-6 liquid-glass rounded-2xl p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/[0.12] flex items-center justify-center text-[var(--accent)] text-[20px] font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[clamp(22px,2.5vw,30px)] font-bold tracking-[-0.03em]">
                  {name}
                </h1>
                {onChain && <TrustBadge score={onChain.trustScore} />}
              </div>
              <p className="text-[13px] text-neutral-500 font-mono mt-1">{agentId || address.slice(0, 16) + "..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onChain && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <StatusDot status={onChain.status} />
                <span className="text-[11px] text-neutral-400">{onChain.status}</span>
              </div>
            )}
            <a
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-neutral-500 hover:text-[var(--accent)] transition-colors px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]"
            >
              solscan ↗
            </a>
          </div>
        </div>

        {description && (
          <p className="text-[14px] text-neutral-400 leading-[1.7] mt-5 max-w-[600px]">
            {description}
          </p>
        )}

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5">
            {capabilities.map((cap) => (
              <span key={cap} className="text-[11px] text-[var(--accent)] bg-[var(--accent)]/[0.08] px-3 py-1 rounded-full">
                {cap}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {onChain && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <div className="liquid-glass rounded-2xl p-5">
            <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">balance</span>
            <p className="text-[22px] num font-bold text-[var(--accent)] leading-none mt-2">${onChain.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="liquid-glass rounded-2xl p-5">
            <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">total volume</span>
            <p className="text-[22px] num font-bold text-white leading-none mt-2">${onChain.spent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="liquid-glass rounded-2xl p-5">
            <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">transactions</span>
            <p className="text-[22px] num font-bold text-white leading-none mt-2">{onChain.txCount}</p>
          </div>
          <div className="liquid-glass rounded-2xl p-5">
            <span className="text-[10px] text-neutral-600 uppercase tracking-[0.15em]">budget</span>
            <p className="text-[22px] num font-bold text-white leading-none mt-2">${onChain.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
        {/* Rate Cards */}
        <div className="liquid-glass rounded-2xl p-6">
          <h3 className="text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-4">
            pricing — rate cards
          </h3>
          {rateCards.length > 0 ? (
            <div className="space-y-2">
              {rateCards.map((rc) => (
                <div key={rc.capability} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-5 py-4">
                  <div>
                    <p className="text-[14px] text-white font-medium">{rc.capability}</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">per {rc.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] num font-bold text-[var(--accent)]">${rc.priceUsdc}</p>
                    <p className="text-[10px] text-neutral-600">USDC</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-neutral-600">no rate cards published.</p>
          )}
        </div>

        {/* SLA + Endpoint */}
        <div className="space-y-3">
          <div className="liquid-glass rounded-2xl p-6">
            <h3 className="text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-4">
              service level agreement
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
                <p className="text-[22px] num font-bold text-[var(--accent)]">{sla.uptimePercent}%</p>
                <p className="text-[10px] text-neutral-600 mt-1">uptime</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
                <p className="text-[22px] num font-bold text-white">{sla.avgResponseMs}<span className="text-[12px] text-neutral-500">ms</span></p>
                <p className="text-[10px] text-neutral-600 mt-1">avg response</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
                <p className="text-[22px] num font-bold text-white">{sla.maxResponseMs}<span className="text-[12px] text-neutral-500">ms</span></p>
                <p className="text-[10px] text-neutral-600 mt-1">max response</p>
              </div>
            </div>
          </div>

          {endpoint && (
            <div className="liquid-glass rounded-2xl p-6">
              <h3 className="text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-4">
                endpoint
              </h3>
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                <span className="flex-1 text-[13px] text-[var(--accent)] font-mono truncate">{endpoint}</span>
                <button
                  onClick={() => copyToClipboard(endpoint, "endpoint")}
                  className="text-[11px] text-neutral-600 hover:text-[var(--accent)] transition-colors shrink-0"
                >
                  {copied === "endpoint" ? "copied ✓" : "copy"}
                </button>
              </div>
            </div>
          )}

          {/* On-chain spending rules */}
          {onChain && (
            <div className="liquid-glass rounded-2xl p-6">
              <h3 className="text-[10px] text-neutral-600 uppercase tracking-[0.12em] mb-4">
                on-chain rules
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                  <span className="text-[13px] text-neutral-500">max per tx</span>
                  <span className="text-[13px] text-white num">{onChain.maxPerTx === -1 ? "unlimited" : `$${onChain.maxPerTx}`}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                  <span className="text-[13px] text-neutral-500">max per day</span>
                  <span className="text-[13px] text-white num">{onChain.maxPerDay === -1 ? "unlimited" : `$${onChain.maxPerDay}`}</span>
                </div>
                {onChain.hasTimeWindow && (
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                    <span className="text-[13px] text-neutral-500">time window</span>
                    <span className="text-[13px] text-[var(--accent)]">enabled</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration guide */}
      <div className="mt-4 liquid-glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[var(--accent)] text-[16px]">◈</span>
          <h3 className="text-[14px] font-semibold tracking-tight">integrate this agent</h3>
        </div>
        <p className="text-[12px] text-neutral-500 mb-5 ml-7">
          use the MPP Vault SDK to discover and pay this agent programmatically.
        </p>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
          <div className="px-4 py-2 border-b border-white/[0.06] text-[11px] text-neutral-500 font-mono tracking-wide flex items-center justify-between">
            <span>integration example</span>
            <button
              onClick={() => copyToClipboard(
                `import { Connection, Keypair } from "@solana/web3.js";
import { MppVaultSDK } from "mpp-vault-sdk";

const sdk = new MppVaultSDK({
  connection: new Connection("https://api.mainnet-beta.solana.com"),
  agentKeypair: Keypair.fromSecretKey(/* your agent keypair */),
});

// Get this agent's catalog
const catalog = await sdk.getAgentCatalog("${address}");
console.log("Capabilities:", catalog.capabilities);
console.log("Rate cards:", catalog.rateCards);

// Pay for a service
const result = await sdk.payForService(
  "YOUR_SUB_ACCOUNT",
  "${address}",
  "${capabilities[0] || "text-generation"}",
);

console.log("Paid:", result.priceUsdc, "USDC");
console.log("Tx:", result.signature);`,
                "code"
              )}
              className="text-[10px] text-neutral-600 hover:text-[var(--accent)] transition-colors"
            >
              {copied === "code" ? "copied ✓" : "copy"}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-[12px] leading-[1.7] font-mono text-neutral-300">
            <code>{`import { Connection, Keypair } from "@solana/web3.js";
import { MppVaultSDK } from "mpp-vault-sdk";

const sdk = new MppVaultSDK({
  connection: new Connection("https://api.mainnet-beta.solana.com"),
  agentKeypair: Keypair.fromSecretKey(/* your agent keypair */),
});

// Get this agent's catalog
const catalog = await sdk.getAgentCatalog("${address}");
console.log("Capabilities:", catalog.capabilities);
console.log("Rate cards:", catalog.rateCards);

// Pay for a service
const result = await sdk.payForService(
  "YOUR_SUB_ACCOUNT",
  "${address}",
  "${capabilities[0] || "text-generation"}",
);

console.log("Paid:", result.priceUsdc, "USDC");
console.log("Tx:", result.signature);`}</code>
          </pre>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex-1">
            <span className="text-[11px] text-neutral-600 w-28 shrink-0 uppercase tracking-[0.08em]">sub-account</span>
            <span className="flex-1 text-[12px] text-white font-mono truncate">{address}</span>
            <button
              onClick={() => copyToClipboard(address, "address")}
              className="text-[11px] text-neutral-600 hover:text-[var(--accent)] transition-colors shrink-0"
            >
              {copied === "address" ? "copied ✓" : "copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
