"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

/* ── data ─────────────────────────────────────────── */

const demoTxs = [
  { letter: "R", agent: "@research_agent", time: "2m", service: "openai mcp", desc: "gpt-4o · 1.2k tokens", tag: "budget", amount: "$12.50", color: "text-purple-400 bg-purple-500/15" },
  { letter: "T", agent: "@trading_bot", time: "5m", service: "market data api", desc: "sol/usdc price feed", tag: "whitelist", amount: "$45.00", color: "text-emerald-400 bg-emerald-500/15" },
  { letter: "C", agent: "@content_writer", time: "8m", service: "claude api", desc: "claude-4 · 800 tokens", tag: "time-lock", amount: "$6.25", color: "text-sky-400 bg-sky-500/15" },
  { letter: "D", agent: "@data_scraper", time: "12m", service: "web scraper", desc: "3 urls queued", tag: "auto", amount: "$2.50", color: "text-amber-400 bg-amber-500/15" },
];

const features = [
  { icon: "⬡", label: "sub-accounts", title: "one vault, many agents.", desc: "each agent gets an isolated sub-account with its own budget. create, pause, close — anytime." },
  { icon: "⊘", label: "spending rules", title: "max per tx. max per day.", desc: "hard limits enforced on-chain by the solana program. can't be bypassed." },
  { icon: "◎", label: "whitelist", title: "approved services only.", desc: "agents can only pay whitelisted addresses. everything else is rejected." },
  { icon: "◷", label: "time rules", title: "when they can spend.", desc: "set time windows — 09:00-17:00 UTC, no weekends. enforced on-chain." },
  { icon: "↻", label: "auto top-up", title: "never run dry.", desc: "minimum balance triggers auto-refill from the main pool. zero downtime." },
  { icon: "⊞", label: "multi-sig", title: "team approvals.", desc: "large payments need multiple signatures. 2-of-3, 3-of-5. defined on-chain." },
];

const steps = [
  { num: "01", title: "deploy vault", desc: "create a vault on solana. a program-derived address holds all funds." },
  { num: "02", title: "set rules", desc: "configure limits, whitelist, time windows. all stored as on-chain account data." },
  { num: "03", title: "agents pay", desc: "agents transact through the vault. rules checked, payment settled, logged on-chain." },
];

const gateItems = ["server-side rules", "trust their server", "wallet per agent", "server dies = no control", "no whitelist", "no time rules"];
const vaultItems = ["on-chain smart contract", "trustless & verifiable", "one vault, sub-accounts", "rules run even offline", "on-chain whitelist", "solana clock enforcement"];

/* ── vanta hero background ────────────────────────── */

function VantaHero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let effect: { destroy: () => void } | null = null;
    const t = setTimeout(async () => {
      try {
        const THREE = await import("three");
        const VANTA = await import("vanta/dist/vanta.fog.min");
        if (!ref.current) return;
        effect = VANTA.default({
          el: ref.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          highlightColor: 0x5eead4,
          midtoneColor: 0x2a7a6a,
          lowlightColor: 0x164545,
          baseColor: 0x080f0f,
          blurFactor: 0.25,
          speed: 0.4,
          zoom: 0.7,
        });
      } catch { /* noop */ }
    }, 100);
    return () => { clearTimeout(t); effect?.destroy(); };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={ref} className="absolute inset-0" style={{ background: "#080f0f" }} />
      {/* dark overlay to tame the fog */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      {/* fade to black at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-b from-transparent to-black pointer-events-none" />
    </div>
  );
}

/* ── page ─────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">

      <Nav />

      {/* ── HERO ── */}
      <section className="relative min-h-[100dvh] overflow-hidden flex items-center">
        <VantaHero />

        <div className="relative z-10 mx-auto max-w-6xl w-full px-6 pt-28 pb-12 lg:pt-32 lg:pb-16">
          <div className="liquid-glass rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* left — content */}
              <div className="p-8 lg:p-12 xl:p-14 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-[15px] font-semibold">mpp vault<span className="text-[var(--accent)]">_</span></span>
                    <span className="text-[11px] text-neutral-600 tracking-wide">built on solana · 0% fees</span>
                  </div>

                  <h1 className="text-[clamp(32px,3.5vw,56px)] font-bold tracking-[-0.04em] leading-[1.0] text-white">
                    every agent<br />has a vault<span className="text-[var(--accent)]">.</span>
                  </h1>
                  <p className="text-[clamp(13px,1vw,15px)] text-neutral-500 leading-[1.7] mt-5 max-w-[380px]">
                    on-chain spending rules. sub-accounts. whitelist. multi-sig. trustless — no server, no middleman.
                  </p>

                  <div className="flex items-center gap-4 mt-8">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2.5 text-[14px] font-semibold text-black bg-[var(--accent)] rounded-full px-7 py-3 hover:brightness-110 transition-all duration-300"
                    >
                      launch app →
                    </Link>
                    <a
                      href="#features"
                      className="inline-flex items-center gap-2 text-[13px] text-neutral-500 hover:text-white transition-colors duration-300"
                    >
                      docs →
                    </a>
                  </div>
                </div>

                {/* stats */}
                <div className="flex items-center gap-6 lg:gap-8 mt-12 pt-6 border-t border-white/[0.06]">
                  {[
                    { val: "0%", label: "fees" },
                    { val: "∞", label: "agents" },
                    { val: "<1s", label: "settlement" },
                    { val: "100%", label: "on-chain" },
                  ].map((s) => (
                    <div key={s.label}>
                      <span className="text-[16px] num font-bold text-white">{s.val}</span>
                      <span className="text-[10px] text-neutral-600 ml-1.5 tracking-wide">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* right — live vault preview */}
              <div className="border-t lg:border-t-0 lg:border-l border-white/[0.06] p-6 lg:p-8 bg-white/[0.01]">
                {/* vault header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/[0.15] flex items-center justify-center text-[var(--accent)] text-[11px] font-bold">V</div>
                    <div>
                      <span className="text-[13px] font-medium text-white">main vault</span>
                      <span className="text-[10px] text-neutral-600 ml-2 font-mono">7xK...f9m</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[var(--accent)] font-medium">● live</span>
                </div>

                {/* balance */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-[0.12em]">vault balance</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-[28px] num font-bold text-white">$12,847</span>
                    <span className="text-[12px] text-neutral-500 font-mono">.50</span>
                  </div>
                </div>

                {/* recent txs */}
                <div className="space-y-[2px]">
                  {demoTxs.map((tx) => (
                    <div key={tx.agent} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${tx.color}`}>{tx.letter}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-white truncate">{tx.agent}</span>
                          <span className="text-[10px] text-neutral-700">{tx.time}</span>
                        </div>
                        <span className="text-[11px] text-neutral-600 truncate block">{tx.desc}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[12px] num font-medium text-white">{tx.amount}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full block mt-0.5 ${tx.color}`}>{tx.tag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          {/* bento grid */}
          <div className="grid grid-cols-6 gap-2">
            {/* row 1: header span-4 + first feature span-2 */}
            <div className="col-span-6 lg:col-span-4 rounded-2xl bg-gradient-to-br from-[var(--accent)]/[0.08] to-transparent border border-[var(--accent)]/[0.12] p-8 lg:p-10 flex flex-col justify-end min-h-[200px]">
              <h2 className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] leading-[1.05]">
                on-chain rules<span className="text-[var(--accent)]">.</span>
              </h2>
              <p className="text-[14px] text-neutral-400 mt-3 max-w-[400px] leading-relaxed">
                no servers. no middlemen. rules live in solana programs and can&apos;t be bypassed.
              </p>
            </div>
            <div className="col-span-6 sm:col-span-3 lg:col-span-2 liquid-glass rounded-2xl p-6 flex flex-col justify-between min-h-[200px]">
              <span className="text-[10px] text-[var(--accent)] uppercase tracking-[0.15em]">{features[0].label}</span>
              <div>
                <h3 className="text-[16px] font-semibold tracking-tight text-white leading-tight">{features[0].title}</h3>
                <p className="text-[12px] text-neutral-500 leading-[1.6] mt-2">{features[0].desc}</p>
              </div>
            </div>

            {/* row 2: 3 equal cards */}
            {features.slice(1, 4).map((f) => (
              <div key={f.label} className="col-span-6 sm:col-span-3 lg:col-span-2 liquid-glass rounded-2xl p-6 flex flex-col justify-between min-h-[180px]">
                <span className="text-[10px] text-[var(--accent)] uppercase tracking-[0.15em]">{f.label}</span>
                <div>
                  <h3 className="text-[16px] font-semibold tracking-tight text-white leading-tight">{f.title}</h3>
                  <p className="text-[12px] text-neutral-500 leading-[1.6] mt-2">{f.desc}</p>
                </div>
              </div>
            ))}

            {/* row 3: 2 remaining + 0% fees */}
            {features.slice(4).map((f) => (
              <div key={f.label} className="col-span-6 sm:col-span-3 lg:col-span-2 liquid-glass rounded-2xl p-6 flex flex-col justify-between min-h-[180px]">
                <span className="text-[10px] text-[var(--accent)] uppercase tracking-[0.15em]">{f.label}</span>
                <div>
                  <h3 className="text-[16px] font-semibold tracking-tight text-white leading-tight">{f.title}</h3>
                  <p className="text-[12px] text-neutral-500 leading-[1.6] mt-2">{f.desc}</p>
                </div>
              </div>
            ))}
            <div className="col-span-6 lg:col-span-2 rounded-2xl bg-gradient-to-br from-[var(--accent)]/[0.06] to-transparent border border-[var(--accent)]/[0.10] p-6 flex flex-col justify-between min-h-[180px]">
              <span className="text-[10px] text-[var(--accent)] uppercase tracking-[0.15em]">fees</span>
              <div>
                <span className="text-[42px] num font-bold text-[var(--accent)] leading-none">0%</span>
                <p className="text-[12px] text-neutral-500 leading-[1.6] mt-2">
                  zero fees. every tx verifiable on solana.
                </p>
              </div>
            </div>
          </div>

          {/* cta */}
          <div className="flex items-center justify-between mt-8">
            <p className="text-[13px] text-neutral-600 hidden sm:block">100% on-chain. 100% trustless.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 text-[14px] font-medium text-white border border-white/20 rounded-full px-7 py-3 hover:bg-white hover:text-black transition-all duration-300"
            >
              get started →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          {/* header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <h2 className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] leading-[1.1]">
              three steps<span className="text-[var(--accent)]">.</span> under a minute<span className="text-[var(--accent)]">.</span>
            </h2>
            <p className="text-[13px] text-neutral-500 leading-[1.7] max-w-[320px] lg:text-right">
              deploy, configure, and let your agents transact — all on-chain, all verifiable.
            </p>
          </div>

          {/* steps — 3 liquid glass cards with big ghost numbers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {steps.map((s) => (
              <div key={s.num} className="liquid-glass rounded-2xl p-7 relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
                <span
                  className="absolute -top-4 -right-2 num font-bold text-white/[0.03] group-hover:text-[var(--accent)]/[0.06] transition-colors duration-500 select-none pointer-events-none"
                  style={{ fontSize: "clamp(100px, 12vw, 160px)", lineHeight: 1 }}
                >
                  {s.num}
                </span>
                <span className="text-[10px] text-[var(--accent)] uppercase tracking-[0.15em] relative z-10">step {s.num}</span>
                <div className="relative z-10">
                  <h3 className="text-[18px] font-semibold tracking-tight text-white">{s.title}</h3>
                  <p className="text-[13px] text-neutral-500 leading-[1.7] mt-2">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section id="compare" className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          {/* header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <h2 className="text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] leading-[1.1]">
              why mpp vault<span className="text-[var(--accent)]">?</span>
            </h2>
            <div className="flex items-center gap-8 text-[11px] uppercase tracking-[0.15em]">
              <span className="text-neutral-600">others</span>
              <span className="text-[var(--accent)]">mpp vault</span>
            </div>
          </div>

          {/* comparison rows */}
          <div className="space-y-[2px]">
            {gateItems.map((bad, i) => (
              <div key={i} className="grid grid-cols-2 group">
                {/* others — faded, struck */}
                <div className="liquid-glass rounded-l-xl rounded-r-none border-r-0 px-5 py-4 lg:px-7 lg:py-5 flex items-center gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full border border-red-500/30 flex items-center justify-center text-red-500/50 text-[10px]">✕</span>
                  <span className="text-[clamp(12px,1vw,14px)] text-neutral-600 line-through decoration-neutral-700">{bad}</span>
                </div>
                {/* mpp vault — highlighted */}
                <div className="relative rounded-r-xl px-5 py-4 lg:px-7 lg:py-5 flex items-center gap-3 border border-l-0 border-[var(--accent)]/[0.10] bg-[var(--accent)]/[0.03] group-hover:bg-[var(--accent)]/[0.06] transition-colors duration-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--accent)]/[0.15] flex items-center justify-center text-[var(--accent)] text-[10px] font-bold">✓</span>
                  <span className="text-[clamp(12px,1vw,14px)] text-white font-medium">{vaultItems[i]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA + FOOTER — single glass box ── */}
      <footer className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="liquid-glass rounded-3xl overflow-hidden">
            {/* CTA area */}
            <div className="relative px-8 pt-14 pb-12 lg:px-14 lg:pt-20 lg:pb-16 overflow-hidden">
              <span
                className="absolute -top-6 right-6 lg:right-14 font-bold tracking-[-0.07em] text-white uppercase opacity-[0.03] select-none pointer-events-none"
                style={{ fontSize: "clamp(100px, 18vw, 260px)", lineHeight: 0.85 }}
              >
                go
              </span>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <div>
                  <h2 className="text-[clamp(30px,3.5vw,48px)] font-bold tracking-[-0.03em] leading-[1.05]">
                    deploy your vault<span className="text-[var(--accent)]">.</span>
                  </h2>
                  <p className="text-[13px] text-neutral-500 leading-[1.7] mt-3 max-w-[380px]">
                    one vault. many agents. all rules on-chain. built on solana, powered by $MVAULT.
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2.5 text-[14px] font-semibold text-black bg-[var(--accent)] rounded-full px-8 py-3.5 hover:brightness-110 transition-all duration-300 shrink-0 self-start lg:self-auto"
                >
                  launch app →
                </Link>
              </div>
            </div>

            {/* divider */}
            <div className="mx-8 lg:mx-14 h-px bg-white/[0.06]" />

            {/* footer content */}
            <div className="px-8 py-10 lg:px-14 lg:py-12">
              <div className="flex flex-col lg:flex-row justify-between gap-10">
                <div className="max-w-[260px]">
                  <span className="text-[15px] font-semibold">
                    mpp vault<span className="text-[var(--accent)]">_</span>
                  </span>
                  <p className="text-[12px] text-neutral-600 mt-3 leading-relaxed">
                    smart wallet infrastructure for autonomous AI agents. on-chain spending rules. built on solana.
                  </p>
                </div>
                <div className="flex gap-14">
                  <div>
                    <p className="text-[10px] text-neutral-600 tracking-[0.15em] uppercase font-medium mb-4">Product</p>
                    <div className="flex flex-col gap-2.5">
                      <Link href="/features" className="text-[12px] text-neutral-500 hover:text-white transition-colors">Features</Link>
                      <Link href="/dashboard" className="text-[12px] text-neutral-500 hover:text-white transition-colors">Dashboard</Link>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-600 tracking-[0.15em] uppercase font-medium mb-4">Resources</p>
                    <div className="flex flex-col gap-2.5">
                      <Link href="/docs" className="text-[12px] text-neutral-500 hover:text-white transition-colors">Docs</Link>
                      <a href="https://x.com/MPPVault" target="_blank" rel="noopener noreferrer" className="text-[12px] text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        Twitter / X
                      </a>
                      <a href="https://github.com/mppvault/mppvault" target="_blank" rel="noopener noreferrer" className="text-[12px] text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/[0.04]">
                <span className="text-[11px] text-neutral-700">© 2026 mpp vault</span>
                <div className="flex items-center gap-4 text-[11px] text-neutral-700">
                  <a href="https://x.com/MPPVault" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <span>·</span>
                  <span>solana</span><span>·</span>
                  <span>$MVAULT</span><span>·</span>
                  <span className="font-mono">CA: 7XPPpKEwNBSA446MxzrCkeT1CytFK1bCiXQWzmFzpump</span><span>·</span>
                  <span>0% fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
