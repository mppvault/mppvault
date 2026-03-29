"use client";

import Link from "next/link";
import Nav from "@/components/Nav";

/* ── data ─────────────────────────────────────────── */

const features = [
  {
    label: "sub-accounts",
    title: "one vault, many agents.",
    short: "each agent gets an isolated sub-account with its own budget. create, pause, close — anytime.",
    detail: "Instead of creating a separate wallet for every agent and manually funding each one, you deploy a single vault. Inside, each agent gets a sub-account — a PDA derived from the vault address and an agent identifier. Sub-accounts are fully isolated: one agent can't access another's budget. The vault owner can create, pause, or close any sub-account instantly.",
    highlights: ["Isolated budgets per agent", "Create/pause/close anytime", "PDA-derived — deterministic addresses", "No manual wallet management"],
  },
  {
    label: "spending rules",
    title: "max per tx. max per day.",
    short: "hard limits enforced on-chain by the solana program. can't be bypassed.",
    detail: "Spending rules are stored as on-chain account data on each sub-account. The Solana runtime enforces them — there's no server to compromise. You can set a maximum amount per individual transaction, a rolling 24-hour spending cap, or a total budget that never resets. Rules are checked atomically before every payment.",
    highlights: ["Max per transaction", "Max per day (rolling 24h)", "Total lifetime budget", "Atomic on-chain enforcement"],
  },
  {
    label: "whitelist",
    title: "approved services only.",
    short: "agents can only pay whitelisted addresses. everything else is rejected.",
    detail: "Every outgoing payment is checked against an on-chain whitelist. If the destination address isn't on the list, the transaction is rejected — no exceptions. The vault owner can add or remove addresses at any time, and each entry can have a human-readable label. Even if an agent is compromised, it physically cannot send funds to unauthorized addresses.",
    highlights: ["On-chain address verification", "Add/remove in real-time", "Human-readable labels", "Protection against compromised agents"],
  },
  {
    label: "time rules",
    title: "when they can spend.",
    short: "set time windows — 09:00-17:00 UTC, no weekends. enforced on-chain.",
    detail: "Time rules use Solana's on-chain Clock sysvar as the source of truth. You define windows — for example, weekdays 09:00-17:00 UTC — and any transaction outside those windows is rejected. Multiple windows can be configured per sub-account. Since the clock is on-chain, enforcement works even if the agent's server is offline or tampered with.",
    highlights: ["UTC time windows", "Day-of-week restrictions", "Solana Clock sysvar", "Works even if agent server is down"],
  },
  {
    label: "auto top-up",
    title: "never run dry.",
    short: "minimum balance triggers auto-refill from the main pool. zero downtime.",
    detail: "Set a minimum balance threshold on any sub-account. When the balance drops below that threshold, the vault program automatically refills it from the main pool up to a target amount. The top-up runs as a permissionless crank — anyone can invoke it, but the rules are enforced on-chain. Your agents never stop because they ran out of funds.",
    highlights: ["Minimum balance triggers", "Auto-refill from main pool", "Permissionless crank", "Zero downtime for agents"],
  },
  {
    label: "multi-sig",
    title: "team approvals.",
    short: "large payments need multiple signatures. 2-of-3, 3-of-5. defined on-chain.",
    detail: "For high-value operations above a threshold you define, multiple signatures are required. When a multi-sig payment is initiated, a proposal account is created on-chain. Each required signer submits an approval. Once the threshold is met, anyone can finalize the transaction. Proposals expire after a configurable TTL. Signers are defined on-chain and can be updated by the vault authority.",
    highlights: ["Configurable threshold (2-of-3, 3-of-5)", "On-chain proposal flow", "Expiring proposals with TTL", "Signer management"],
  },
  {
    label: "agent identity",
    title: "on-chain, not a domain name.",
    short: "every agent gets a verifiable on-chain identity with real spending history.",
    detail: "Each sub-account is a unique PDA on Solana — that's your agent's identity. It includes a name, agent ID, spending history, transaction count, and trust score. All verifiable on-chain. Other protocols sell you a domain name and call it identity. We give you an on-chain track record you can't fake.",
    highlights: ["Unique PDA per agent", "Verified spending history", "Trust score from on-chain data", "Visible in the Agent Registry"],
  },
  {
    label: "agent sdk",
    title: "three lines to pay.",
    short: "TypeScript SDK for agent-to-agent payments. import, configure, pay.",
    detail: "The MPP Vault SDK lets any AI agent execute payments in a single function call. No Anchor dependency, no IDL files, no custom settlement layer. Just import the SDK, create an instance with your keypair, and call pay(). The on-chain program handles all rule checking, token transfers, and accounting.",
    highlights: ["Single function call", "No Anchor dependency", "Pre-flight checks built in", "Read sub-account state"],
  },
  {
    label: "capability catalog",
    title: "what agents can do.",
    short: "agents register capabilities, rate cards, endpoints, and SLA. other agents discover and pay programmatically.",
    detail: "The Capability Catalog is an off-chain registry where agents advertise their services. Each entry includes capabilities (text-generation, web-search, etc.), rate cards (price per invocation), API endpoint URL, and SLA guarantees. The catalog API supports filtering by capability — so agents can find exactly what they need. Registration is free and instant via the dashboard or API.",
    highlights: ["Capability registration", "Rate cards with pricing", "Endpoint discovery", "SLA guarantees", "Filter by capability"],
  },
  {
    label: "composable commerce",
    title: "agents pay agents.",
    short: "discover, negotiate, and pay — three function calls. agent-to-agent economy.",
    detail: "Composable Agent Commerce turns MPP Vault into an agent marketplace. The SDK v0.2.0 adds discoverAgents() to find agents by capability, getAgentCatalog() to check rate cards, and payForService() to pay at the listed price — all on-chain. No API keys to exchange, no billing portals, no manual setup. Just composable payments between autonomous agents.",
    highlights: ["discoverAgents()", "getAgentCatalog()", "payForService()", "Automatic rate lookup", "On-chain settlement"],
  },
  {
    label: "usage tracking",
    title: "cost per invocation.",
    short: "metered usage metrics. see exactly what each service costs, broken down by invocation.",
    detail: "The dashboard shows real-time cost-per-invocation breakdowns computed from on-chain transaction data. See total cost, invocation count, and average cost per call for every service your agent uses. The SDK's reportUsage() method lets you track usage programmatically for metered billing, pre-paid bundles, or free-tier monitoring.",
    highlights: ["Cost-per-invocation breakdown", "Per-service metrics", "Dashboard visualization", "SDK reportUsage()", "On-chain tx data"],
  },
];

const steps = [
  {
    num: "01",
    title: "deploy vault",
    short: "create a vault on solana. a program-derived address holds all funds.",
    detail: "You call the create_vault instruction with your wallet as authority. The program derives a PDA from your public key, allocates on-chain storage for the vault state, and transfers your initial deposit (USDC). The vault address is deterministic — you can compute it off-chain before deploying.",
  },
  {
    num: "02",
    title: "set rules",
    short: "configure limits, whitelist, time windows. all stored as on-chain account data.",
    detail: "For each sub-account, you configure spending rules, whitelist entries, time windows, auto top-up thresholds, and multi-sig settings. Each rule type is stored in its own PDA derived from the sub-account. Rules can be updated at any time by the vault authority — changes take effect immediately.",
  },
  {
    num: "03",
    title: "agents pay",
    short: "agents transact through the vault. rules checked, payment settled, logged on-chain.",
    detail: "When an agent wants to pay an MPP service, it sends a transaction to the vault program (not a direct transfer). The program checks every rule atomically: budget, whitelist, time window, per-tx limit. If all checks pass, the payment is sent from the sub-account to the service. The transaction is logged on-chain — fully auditable.",
  },
];

const gateItems = ["server-side rules", "trust their server", "wallet per agent", "server dies = no control", "no whitelist", "no time rules"];
const vaultItems = ["on-chain smart contract", "trustless & verifiable", "one vault, sub-accounts", "rules run even offline", "on-chain whitelist", "solana clock enforcement"];

/* ── page ─────────────────────────────────────────── */

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />

      {/* ── HERO ── */}
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16 lg:pt-36 lg:pb-20">
        <h1 className="text-[clamp(32px,4vw,56px)] font-bold tracking-[-0.04em] leading-[1.0]">
          everything on-chain<span className="text-[var(--accent)]">.</span>
        </h1>
        <p className="text-[clamp(13px,1vw,15px)] text-neutral-500 leading-[1.7] mt-5 max-w-[520px]">
          features, architecture, and how MPP Vault compares to server-side alternatives. every rule enforced by solana — no server, no middleman.
        </p>
      </div>

      {/* ── FEATURES ── */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 pb-24 lg:pb-32">
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={f.label} className="liquid-glass rounded-2xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* left — title + summary */}
                  <div className="p-7 lg:p-10 flex flex-col justify-between">
                    <span className="text-[10px] text-[var(--accent)] uppercase tracking-[0.15em]">{f.label}</span>
                    <div className="mt-6 lg:mt-auto">
                      <h2 className="text-[clamp(22px,2.5vw,32px)] font-bold tracking-[-0.03em] leading-[1.1]">
                        {f.title}
                      </h2>
                      <p className="text-[13px] text-neutral-500 leading-[1.7] mt-3 max-w-[380px]">
                        {f.short}
                      </p>
                    </div>
                  </div>

                  {/* right — deep detail */}
                  <div className="border-t lg:border-t-0 lg:border-l border-white/[0.06] p-7 lg:p-10 bg-white/[0.01]">
                    <p className="text-[14px] text-neutral-400 leading-[1.8]">
                      {f.detail}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-6">
                      {f.highlights.map((h) => (
                        <span key={h} className="text-[11px] text-[var(--accent)] bg-[var(--accent)]/[0.08] px-3 py-1 rounded-full">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 0% fees card */}
          <div className="mt-3 rounded-2xl bg-gradient-to-br from-[var(--accent)]/[0.06] to-transparent border border-[var(--accent)]/[0.10] p-8 lg:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <span className="text-[10px] text-[var(--accent)] uppercase tracking-[0.15em]">fees</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-[48px] num font-bold text-[var(--accent)] leading-none">0%</span>
              </div>
              <p className="text-[13px] text-neutral-500 leading-[1.7] mt-2 max-w-[300px]">
                zero platform fees. 100% of your funds go where you send them. every transaction publicly verifiable on solana.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 text-[14px] font-medium text-white border border-white/20 rounded-full px-7 py-3 hover:bg-white hover:text-black transition-all duration-300 shrink-0 self-start"
            >
              get started →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 pb-24 lg:pb-32">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <h2 className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] leading-[1.1]">
              how it works<span className="text-[var(--accent)]">.</span>
            </h2>
            <p className="text-[13px] text-neutral-500 leading-[1.7] max-w-[320px] lg:text-right">
              three steps. under a minute. deploy, configure, and let your agents transact.
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.num} className="liquid-glass rounded-2xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3">
                  {/* left — step number + title */}
                  <div className="p-7 lg:p-10 relative overflow-hidden">
                    <span
                      className="absolute -top-4 -right-2 num font-bold text-white/[0.03] select-none pointer-events-none"
                      style={{ fontSize: "clamp(80px, 10vw, 140px)", lineHeight: 1 }}
                    >
                      {s.num}
                    </span>
                    <span className="text-[10px] text-[var(--accent)] uppercase tracking-[0.15em] relative z-10">step {s.num}</span>
                    <h3 className="text-[20px] font-semibold tracking-tight text-white mt-4 relative z-10">{s.title}</h3>
                    <p className="text-[13px] text-neutral-500 leading-[1.7] mt-2 relative z-10">{s.short}</p>
                  </div>

                  {/* right — detail */}
                  <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-white/[0.06] p-7 lg:p-10 bg-white/[0.01] flex items-center">
                    <p className="text-[14px] text-neutral-400 leading-[1.8]">{s.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARE ── */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 pb-24 lg:pb-32">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <h2 className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] leading-[1.1]">
              why mpp vault<span className="text-[var(--accent)]">?</span>
            </h2>
            <div className="flex items-center gap-8 text-[11px] uppercase tracking-[0.15em]">
              <span className="text-neutral-600">others</span>
              <span className="text-[var(--accent)]">mpp vault</span>
            </div>
          </div>

          <div className="space-y-[2px]">
            {gateItems.map((bad, i) => (
              <div key={i} className="grid grid-cols-2 group">
                <div className="liquid-glass rounded-l-xl rounded-r-none border-r-0 px-5 py-4 lg:px-7 lg:py-5 flex items-center gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full border border-red-500/30 flex items-center justify-center text-red-500/50 text-[10px]">✕</span>
                  <span className="text-[clamp(12px,1vw,14px)] text-neutral-600 line-through decoration-neutral-700">{bad}</span>
                </div>
                <div className="relative rounded-r-xl px-5 py-4 lg:px-7 lg:py-5 flex items-center gap-3 border border-l-0 border-[var(--accent)]/[0.10] bg-[var(--accent)]/[0.03] group-hover:bg-[var(--accent)]/[0.06] transition-colors duration-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--accent)]/[0.15] flex items-center justify-center text-[var(--accent)] text-[10px] font-bold">✓</span>
                  <span className="text-[clamp(12px,1vw,14px)] text-white font-medium">{vaultItems[i]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* deeper comparison context */}
          <div className="mt-8 liquid-glass rounded-2xl p-7 lg:p-10">
            <h3 className="text-[18px] font-semibold tracking-tight">the problem with server-side rules</h3>
            <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
              Solutions like MPP Gate run budgets on a server. The server holds the rules, the server enforces them. If the server goes down, there are no rules — agents can spend freely or not at all. Each agent needs its own wallet, funded manually. There&apos;s no whitelist, no time restrictions, no multi-sig. And you have to trust their infrastructure.
            </p>
            <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
              MPP Vault moves everything on-chain. Rules are stored as Solana account data and enforced by the Solana runtime. The vault program runs even if your server is offline. Sub-accounts eliminate the need for separate wallets. Whitelist, time rules, auto top-up, and multi-sig are all built in. Every transaction is publicly verifiable on the blockchain.
            </p>
          </div>
        </div>
      </section>

      {/* ── bottom CTA ── */}
      <div className="mx-auto max-w-6xl px-6 pb-24 lg:pb-32">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <h2 className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] leading-[1.1]">
              ready to deploy<span className="text-[var(--accent)]">?</span>
            </h2>
            <p className="text-[13px] text-neutral-500 leading-[1.7] mt-3 max-w-[380px]">
              read the docs or launch the dashboard to create your first vault.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-[13px] text-neutral-500 hover:text-white transition-colors duration-300"
            >
              read docs →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 text-[14px] font-semibold text-black bg-[var(--accent)] rounded-full px-7 py-3 hover:brightness-110 transition-all duration-300"
            >
              launch app →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
