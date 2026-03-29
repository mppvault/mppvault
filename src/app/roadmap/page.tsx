"use client";

import Nav from "@/components/Nav";
import Link from "next/link";

const phases = [
  {
    number: "01",
    label: "Foundation",
    status: "live",
    description: "The core infrastructure. Everything needed to deploy a vault and start managing agent spending on-chain.",
    items: [
      "Smart contract deployed on Solana mainnet",
      "Vault and sub-account system",
      "On-chain spending rules — per-transaction limit, daily cap, time windows",
      "Recipient whitelist enforced by the program",
      "Pause and resume sub-accounts",
      "Dashboard — deploy, fund, configure",
      "Open source codebase",
      "0% fees",
    ],
  },
  {
    number: "02",
    label: "Agent Integration",
    status: "building",
    description: "Making it easy for developers to connect any AI agent to MPP Vault with minimal setup.",
    items: [
      "Agent Registry — public on-chain directory with verified spending history and trust scores",
      "MCP server — connect MPP Vault directly to Claude, GPT, and other agents",
      "TypeScript SDK — execute_payment in a single function call",
      "Developer documentation — integrate in under 10 minutes",
      "API key generation scoped to a sub-account",
      "Example agent implementations",
    ],
  },
  {
    number: "03",
    label: "Vault Intelligence",
    status: "planned",
    description: "Smarter vaults. More visibility. Less manual work.",
    items: [
      "Auto top-up — automatically refill sub-account balances when they drop below a threshold",
      "Spending analytics — daily spend charts, agent activity, budget tracking",
      "Transaction alerts — get notified when an agent executes a payment",
      "Multi-signature vault support",
      "Bulk sub-account management",
    ],
  },
  {
    number: "04",
    label: "Ecosystem",
    status: "planned",
    description: "Building the network around MPP Vault — integrations, partners, and community.",
    items: [
      "Token-gated features for $MVAULT holders",
      "Verified recipient directory — pre-approved AI services ready to whitelist",
      "Partner integrations — connect to popular AI infrastructure out of the box",
      "Mobile dashboard",
      "Grants for builders integrating MPP Vault",
    ],
  },
];

const statusConfig = {
  live: { label: "live", color: "text-[var(--accent)] bg-[var(--accent)]/[0.10]" },
  building: { label: "building", color: "text-amber-400 bg-amber-400/[0.10]" },
  planned: { label: "planned", color: "text-neutral-500 bg-neutral-500/[0.10]" },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />

      <div className="mx-auto max-w-4xl px-6 pt-28 pb-24 lg:pt-36 lg:pb-32">

        {/* Header */}
        <div className="mb-20">
          <p className="text-[11px] text-[var(--accent)] uppercase tracking-[0.18em] font-medium mb-4">
            roadmap
          </p>
          <h1 className="text-[clamp(32px,4vw,52px)] font-bold tracking-[-0.04em] leading-[1.05]">
            what we are building<span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-[15px] text-neutral-500 leading-[1.7] mt-5 max-w-[540px]">
            MPP Vault is a long-term infrastructure project. Phase 1 is live on Solana mainnet. Everything below is what comes next.
          </p>
        </div>

        {/* Phases */}
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.06] hidden sm:block" />

          <div className="space-y-12">
            {phases.map((phase) => {
              const s = statusConfig[phase.status as keyof typeof statusConfig];
              return (
                <div key={phase.number} className="relative sm:pl-14">
                  {/* dot */}
                  <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border hidden sm:flex items-center justify-center text-[12px] font-bold tracking-tight shrink-0 ${
                    phase.status === "live"
                      ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.08] text-[var(--accent)]"
                      : phase.status === "building"
                        ? "border-amber-400/30 bg-amber-400/[0.06] text-amber-400"
                        : "border-white/[0.08] bg-white/[0.02] text-neutral-600"
                  }`}>
                    {phase.number}
                  </div>

                  <div className="liquid-glass rounded-2xl p-7">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[11px] text-neutral-600 font-mono sm:hidden">{phase.number}</span>
                          <h2 className="text-[20px] font-bold tracking-tight">
                            {phase.label}
                          </h2>
                        </div>
                        <p className="text-[13px] text-neutral-500 leading-[1.7]">
                          {phase.description}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-medium ${s.color}`}>
                        {s.label}
                      </span>
                    </div>

                    <div className="space-y-2 mt-5">
                      {phase.items.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3"
                        >
                          <span className={`mt-0.5 text-[12px] shrink-0 ${
                            phase.status === "live"
                              ? "text-[var(--accent)]"
                              : phase.status === "building"
                                ? "text-amber-400"
                                : "text-neutral-600"
                          }`}>
                            {phase.status === "live" ? "✓" : "○"}
                          </span>
                          <span className="text-[13px] text-neutral-400 leading-[1.6]">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 liquid-glass rounded-2xl p-8 text-center">
          <p className="text-[11px] text-neutral-600 uppercase tracking-[0.15em] mb-3">built in public</p>
          <h3 className="text-[20px] font-bold tracking-tight mb-3">
            we ship. follow along.
          </h3>
          <p className="text-[13px] text-neutral-500 mb-6 max-w-sm mx-auto leading-[1.7]">
            MPP Vault is open source. every update is public. the smart contract is verifiable on-chain.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/dashboard" className="btn-primary text-[13px]">
              launch app
            </Link>
            <a
              href="https://x.com/MPPVault"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] text-neutral-400 hover:text-white hover:border-white/20 transition-all"
            >
              follow on X
            </a>
            <a
              href="https://github.com/mppvault/mppvault"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] text-neutral-400 hover:text-white hover:border-white/20 transition-all"
            >
              view on GitHub
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
