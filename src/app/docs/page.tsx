"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

/* ── section data ────────────────────────────────── */

const sections = [
  { id: "getting-started", label: "Getting Started" },
  { id: "architecture", label: "Architecture" },
  { id: "payment-flow", label: "Payment Flow" },
  { id: "agent-identity", label: "Agent Identity" },
  { id: "agent-sdk", label: "Agent SDK" },
  { id: "create-vault", label: "Create a Vault" },
  { id: "sub-accounts", label: "Sub-Accounts" },
  { id: "spending-rules", label: "Spending Rules" },
  { id: "whitelist", label: "Whitelist" },
  { id: "time-rules", label: "Time Rules" },
  { id: "auto-top-up", label: "Auto Top-Up" },
  { id: "multi-sig", label: "Multi-Sig" },
  { id: "api-reference", label: "API Reference" },
];

/* ── reusable code block ─────────────────────────── */

function Code({ children, title }: { children: string; title?: string }) {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
      {title && (
        <div className="px-4 py-2 border-b border-white/[0.06] text-[11px] text-neutral-500 font-mono tracking-wide">
          {title}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-[13px] leading-[1.7] font-mono text-neutral-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* ── page ─────────────────────────────────────────── */

export default function DocsPage() {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />

      <div className="mx-auto max-w-6xl px-6 pt-28 pb-12 lg:pt-32 lg:pb-16">
        {/* ── hero area ── */}
        <div className="mb-16">
          <h1 className="text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.04em] leading-[1.05]">
            documentation<span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-[15px] text-neutral-500 leading-[1.7] mt-4 max-w-[560px]">
            Everything you need to deploy and manage smart wallet
            infrastructure for AI agents on Solana. On-chain rules,
            sub-accounts, whitelist, multi-sig — all trustless.
          </p>
        </div>

        {/* ── sidebar + content layout ── */}
        <div className="flex gap-12 lg:gap-16">
          {/* left nav */}
          <nav className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] text-neutral-600 uppercase tracking-[0.15em] font-medium mb-4">
                On this page
              </p>
              <ul className="space-y-1">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`block text-[13px] py-1.5 px-3 rounded-lg transition-all duration-200 ${
                        active === s.id
                          ? "text-[var(--accent)] bg-[var(--accent)]/[0.08] border-l-2 border-[var(--accent)]"
                          : "text-neutral-500 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <Link
                  href="/dashboard"
                  className="block text-[12px] text-[var(--accent)] hover:underline"
                >
                  Open Dashboard →
                </Link>
              </div>
            </div>
          </nav>

          {/* right content */}
          <div className="flex-1 min-w-0">
            {/* ── Getting Started ── */}
            <section id="getting-started" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Getting Started
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                MPP Vault is smart wallet infrastructure for autonomous AI agents on Solana, built on top of Machine Payments Protocol (MPP).
              </p>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                <span className="text-white font-medium">The problem:</span> AI agents that spend money via MPP have no real control today. Solutions like MPP Gate run budgets on a server — if the server dies, there are no rules. And each agent needs its own wallet, funded manually.
              </p>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                <span className="text-white font-medium">The solution:</span> MPP Vault is a single Solana program (smart contract) that acts as a central vault. All rules are enforced on-chain. Trustless — no server, no middleman. You deploy one vault, create sub-accounts for each agent, and every spending rule is stored as on-chain account data.
              </p>

              <div className="mt-6 rounded-xl border border-[var(--accent)]/[0.12] bg-[var(--accent)]/[0.04] p-5">
                <p className="text-[13px] text-[var(--accent)] font-medium mb-1">
                  Core concept
                </p>
                <p className="text-[13px] text-neutral-400 leading-[1.8]">
                  One vault, many agents. You deploy one vault on Solana. Inside the vault you create sub-accounts — one per agent. Each sub-account has its own rules. All funds live in the vault, but each agent can only access its own sub-account within the rules you&apos;ve set.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
                <p className="text-[13px] text-white font-medium mb-2">
                  Quick start
                </p>
                <ul className="text-[13px] text-neutral-400 leading-[1.8] space-y-1">
                  <li><span className="text-white font-medium">1.</span> Deploy a vault (PDA) on Solana</li>
                  <li><span className="text-white font-medium">2.</span> Create sub-accounts for each agent</li>
                  <li><span className="text-white font-medium">3.</span> Set spending rules, whitelist, time windows</li>
                  <li><span className="text-white font-medium">4.</span> Agents transact through the vault — rules enforced on-chain</li>
                </ul>
              </div>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Architecture ── */}
            <section id="architecture" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Architecture
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                The MPP Vault system consists of four on-chain components:
              </p>
              <ul className="text-[14px] text-neutral-400 leading-[1.8] mt-3 space-y-2 ml-1">
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span><span className="text-white font-medium">Solana program</span> — built with Anchor framework, holds all logic</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span><span className="text-white font-medium">Vault PDA</span> — program-derived address that holds all funds (USDC as primary currency)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span><span className="text-white font-medium">Sub-account PDAs</span> — one per agent, derived from vault + agent ID</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span><span className="text-white font-medium">Rules as account data</span> — spending limits, whitelist, time rules stored on each sub-account</span>
                </li>
              </ul>

              <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
                <p className="text-[13px] text-white font-medium mb-2">Vault owner can:</p>
                <ul className="text-[13px] text-neutral-400 leading-[1.7] space-y-1">
                  <li>Create / pause / close sub-accounts</li>
                  <li>Set and modify rules per sub-account</li>
                  <li>Add / remove from whitelist</li>
                  <li>Deposit / withdraw funds</li>
                  <li>Set multi-sig threshold</li>
                  <li>Emergency stop — pause an agent instantly</li>
                </ul>
              </div>

              <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
                <p className="text-[13px] text-white font-medium mb-2">Agents can:</p>
                <ul className="text-[13px] text-neutral-400 leading-[1.7] space-y-1">
                  <li>View own balance and rules</li>
                  <li>Make payments within rules</li>
                  <li>View own transaction history</li>
                </ul>
              </div>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Payment Flow ── */}
            <section id="payment-flow" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Payment Flow
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                When an agent wants to pay for a service via MPP, the payment flows through the vault program instead of a direct transfer. Every step is verified on-chain.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { step: "1", text: "Agent wants to pay an MPP service" },
                  { step: "2", text: "Service responds HTTP 402 with payment requirement" },
                  { step: "3", text: "Agent sends a transaction to the Vault program (not a direct payment)" },
                  { step: "4", text: "Program checks: has budget? Whitelisted? Within time window? Under max?" },
                  { step: "5", text: "If all checks pass, program sends payment from agent\u2019s sub-account to service" },
                  { step: "6", text: "Transaction logged on-chain — fully auditable" },
                  { step: "7", text: "Agent retries with payment credential and gets the resource" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--accent)]/[0.10] flex items-center justify-center text-[var(--accent)] text-[11px] font-bold num">{s.step}</span>
                    <p className="text-[14px] text-neutral-400 leading-[1.8] pt-0.5">{s.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-[var(--accent)]/[0.12] bg-[var(--accent)]/[0.04] p-5">
                <p className="text-[13px] text-[var(--accent)] font-medium mb-1">
                  Currency
                </p>
                <p className="text-[13px] text-neutral-400 leading-[1.7]">
                  USDC (SPL token) on Solana is the primary currency. Can be extended to other SPL tokens. Works with any MPP-compatible service — API endpoints, MCP servers, or any HTTP-addressable service that accepts MPP payments.
                </p>
              </div>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Agent Identity ── */}
            <section id="agent-identity" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Agent Identity
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Every agent on MPP Vault has a native on-chain identity. When you create a sub-account, the agent gets a unique program-derived address (PDA) on Solana — this is its identity. No domain names, no registries. Just a verifiable on-chain account.
              </p>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Each agent identity includes:
              </p>
              <ul className="text-[14px] text-neutral-400 leading-[1.8] mt-3 space-y-2 ml-1">
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span><span className="text-white font-medium">Unique PDA</span> — deterministic address derived from vault + index, verifiable by anyone</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span><span className="text-white font-medium">Name &amp; Agent ID</span> — human-readable identifier stored on-chain (max 32 / 64 bytes)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span><span className="text-white font-medium">Verified spending history</span> — total spent, transaction count, daily spend — all on-chain</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span><span className="text-white font-medium">Trust score</span> — computed from on-chain activity in the <a href="/registry" className="text-[var(--accent)] hover:underline">Agent Registry</a></span>
                </li>
              </ul>

              <div className="mt-6 rounded-xl border border-[var(--accent)]/[0.12] bg-[var(--accent)]/[0.04] p-5">
                <p className="text-[13px] text-[var(--accent)] font-medium mb-1">
                  Why this matters
                </p>
                <p className="text-[13px] text-neutral-400 leading-[1.8]">
                  Other protocols sell you a domain name and call it &ldquo;agent identity.&rdquo; That&apos;s a registry entry, not identity. On MPP Vault, your agent&apos;s identity is its on-chain spending history. You can&apos;t fake 50 transactions or $10,000 in verified volume.
                </p>
              </div>

              <Code title="Resolve an agent identity">
{`import { Connection, PublicKey } from "@solana/web3.js";
import { MppVaultSDK } from "mpp-vault-sdk";

const sdk = new MppVaultSDK({
  connection: new Connection("https://api.mainnet-beta.solana.com"),
  programId: "2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx",
  agentKeypair: myKeypair,
});

const agent = await sdk.getSubAccount("8DDsUJ7hP6swV6DqnnqSYhyzRTwcXfWnmc5fapyavxhj");
console.log("Name:", agent.name);
console.log("Agent ID:", agent.agentId);
console.log("Total spent:", agent.spent, "USDC");
console.log("Transactions:", agent.txCount);
console.log("Status:", agent.status);`}
              </Code>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Agent SDK ── */}
            <section id="agent-sdk" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Agent SDK
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                The MPP Vault SDK lets any AI agent execute payments in a single function call. No Anchor dependency, no IDL files. Just import, configure, and pay.
              </p>

              <Code title="Install">
{`npm install mpp-vault-sdk @solana/web3.js`}
              </Code>

              <Code title="Quick start — execute a payment">
{`import { Connection, Keypair } from "@solana/web3.js";
import { MppVaultSDK } from "mpp-vault-sdk";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const agentKeypair = Keypair.fromSecretKey(/* your agent's keypair */);

const vault = new MppVaultSDK({
  connection,
  programId: "2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx",
  agentKeypair,
});

// Check if payment is possible before sending
const check = await vault.canPay("YOUR_SUB_ACCOUNT_ADDRESS", 5.00);
if (!check.allowed) {
  console.error("Cannot pay:", check.reason);
  process.exit(1);
}

// Execute payment — 5 USDC to a whitelisted recipient
const result = await vault.pay(
  "YOUR_SUB_ACCOUNT_ADDRESS",     // your agent's sub-account
  "RECIPIENT_WALLET_ADDRESS",      // must be whitelisted
  5.00,                            // amount in USDC
);

console.log("Payment sent:", result.signature);
console.log("Amount:", result.amount, "USDC");
console.log("To:", result.recipient);`}
              </Code>

              <Code title="Read sub-account state">
{`const info = await vault.getSubAccount("YOUR_SUB_ACCOUNT_ADDRESS");

console.log("Balance:", info.balance, "USDC");
console.log("Spent today:", info.spentToday, "USDC");
console.log("Max per tx:", info.maxPerTx, "USDC");
console.log("Max per day:", info.maxPerDay, "USDC");
console.log("Status:", info.status);
console.log("Total transactions:", info.txCount);`}
              </Code>

              <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-4 py-3 font-medium text-neutral-400">Method</th>
                      <th className="px-4 py-3 font-medium text-neutral-400">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {[
                      ["vault.pay(subAccount, recipient, amount)", "Execute USDC payment to whitelisted recipient"],
                      ["vault.canPay(subAccount, amount)", "Pre-check if payment will succeed"],
                      ["vault.getSubAccount(address)", "Read sub-account balance, rules, and stats"],
                    ].map(([method, desc]) => (
                      <tr key={method} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 font-mono text-[var(--accent)] text-[12px]">{method}</td>
                        <td className="px-4 py-2.5 text-neutral-400">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--accent)]/[0.12] bg-[var(--accent)]/[0.04] p-5">
                <p className="text-[13px] text-[var(--accent)] font-medium mb-1">
                  Three lines to pay
                </p>
                <p className="text-[13px] text-neutral-400 leading-[1.8]">
                  Other protocols require you to understand their custom settlement layer, buy domain names, and set up webhooks. With MPP Vault: create SDK instance, call <code className="text-[12px] font-mono text-neutral-300 bg-white/[0.04] px-1.5 py-0.5 rounded">pay()</code>, done. The on-chain program handles everything else.
                </p>
              </div>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Create a Vault ── */}
            <section id="create-vault" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Create a Vault
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                A vault is the root account for all agent activity. When you
                create a vault, the program derives a PDA from your wallet
                address and a nonce, allocates on-chain storage, and
                transfers initial funds. The vault owner retains full
                administrative control — adding sub-accounts, modifying
                rules, withdrawing funds.
              </p>

              <Code title="create_vault.rs">
{`use anchor_lang::prelude::*;
use mpp_vault::program::MppVault;
use mpp_vault::state::Vault;

pub fn create_vault(
    ctx: Context<CreateVault>,
    name: String,
    initial_deposit: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.authority.key();
    vault.name = name;
    vault.balance = initial_deposit;
    vault.created_at = Clock::get()?.unix_timestamp;
    vault.bump = ctx.bumps.vault;

    // Transfer SOL from authority to vault PDA
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        initial_deposit,
    )?;

    msg!("Vault '{}' created with {} lamports", vault.name, initial_deposit);
    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateVault<'info> {
    #[account(
        init,
        payer = authority,
        space = Vault::LEN,
        seeds = [b"vault", authority.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}`}
              </Code>

              <Code title="TypeScript SDK">
{`import { MppVault } from "@mpp/vault-sdk";
import { Connection, Keypair } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const wallet = Keypair.fromSecretKey(/* ... */);

const vault = await MppVault.create(connection, {
  authority: wallet.publicKey,
  name: "production-vault",
  initialDeposit: 10_000_000_000, // 10 SOL in lamports
});

console.log("Vault PDA:", vault.address.toBase58());
// => Vault PDA: 7xKm...f9mP`}
              </Code>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Sub-Accounts ── */}
            <section id="sub-accounts" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Sub-Accounts
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Each AI agent operates through its own sub-account — an
                isolated partition within the vault. Sub-accounts have their
                own balance, spending rules, and whitelist. The vault owner
                can create, pause, or close any sub-account at any time.
                Budget allocation determines how much of the vault&apos;s total
                pool each agent can access.
              </p>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Sub-accounts are derived as PDAs from the vault address and
                an agent identifier (typically the agent&apos;s public key or a
                human-readable label). This means sub-account addresses are
                deterministic and can be computed off-chain.
              </p>

              <Code title="create_sub_account.rs">
{`pub fn create_sub_account(
    ctx: Context<CreateSubAccount>,
    agent_id: String,
    budget: u64,
) -> Result<()> {
    let sub = &mut ctx.accounts.sub_account;
    sub.vault = ctx.accounts.vault.key();
    sub.agent_id = agent_id;
    sub.budget = budget;
    sub.spent = 0;
    sub.active = true;
    sub.bump = ctx.bumps.sub_account;

    msg!("Sub-account '{}' created with budget {}", sub.agent_id, budget);
    Ok(())
}

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct CreateSubAccount<'info> {
    #[account(
        init,
        payer = authority,
        space = SubAccount::LEN,
        seeds = [b"sub", vault.key().as_ref(), agent_id.as_bytes()],
        bump
    )]
    pub sub_account: Account<'info, SubAccount>,
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}`}
              </Code>

              <Code title="TypeScript SDK">
{`const subAccount = await vault.createSubAccount({
  agentId: "research_agent",
  budget: 2_000_000_000, // 2 SOL
});

// List all sub-accounts
const accounts = await vault.listSubAccounts();
accounts.forEach((a) => {
  console.log(\`\${a.agentId}: \${a.budget / 1e9} SOL (spent: \${a.spent / 1e9})\`);
});`}
              </Code>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Spending Rules ── */}
            <section id="spending-rules" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Spending Rules
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Spending rules define hard limits on what an agent can spend.
                They are stored as on-chain account data attached to a
                sub-account and enforced by the Solana runtime — the agent
                cannot bypass them. Two primary rule types:
              </p>
              <ul className="text-[14px] text-neutral-400 leading-[1.8] mt-3 space-y-2 ml-1">
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span>
                    <span className="text-white font-medium">
                      Max per transaction
                    </span>{" "}
                    — rejects any single transaction above the limit.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] shrink-0">▸</span>
                  <span>
                    <span className="text-white font-medium">
                      Max per day
                    </span>{" "}
                    — rolling 24-hour spending cap. Resets based on Solana
                    clock timestamps.
                  </span>
                </li>
              </ul>

              <Code title="set_spending_rules.rs">
{`pub fn set_spending_rules(
    ctx: Context<SetSpendingRules>,
    max_per_tx: u64,
    max_per_day: u64,
) -> Result<()> {
    let rules = &mut ctx.accounts.spending_rules;
    rules.sub_account = ctx.accounts.sub_account.key();
    rules.max_per_tx = max_per_tx;
    rules.max_per_day = max_per_day;
    rules.spent_today = 0;
    rules.day_start = Clock::get()?.unix_timestamp;

    msg!(
        "Rules set: max/tx={}, max/day={}",
        max_per_tx,
        max_per_day
    );
    Ok(())
}

// Enforcement during payment
pub fn execute_payment(ctx: Context<ExecutePayment>, amount: u64) -> Result<()> {
    let rules = &ctx.accounts.spending_rules;
    let clock = Clock::get()?;

    require!(amount <= rules.max_per_tx, VaultError::ExceedsMaxPerTx);

    let elapsed = clock.unix_timestamp - rules.day_start;
    let spent = if elapsed >= 86_400 { 0 } else { rules.spent_today };
    require!(spent + amount <= rules.max_per_day, VaultError::ExceedsMaxPerDay);

    // ... transfer logic
    Ok(())
}`}
              </Code>

              <Code title="TypeScript SDK">
{`await subAccount.setSpendingRules({
  maxPerTx: 500_000_000,     // 0.5 SOL per transaction
  maxPerDay: 2_000_000_000,  // 2 SOL per day
});

// Check current usage
const rules = await subAccount.getSpendingRules();
console.log(\`Spent today: \${rules.spentToday / 1e9} SOL\`);
console.log(\`Remaining:   \${(rules.maxPerDay - rules.spentToday) / 1e9} SOL\`);`}
              </Code>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Whitelist ── */}
            <section id="whitelist" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Whitelist
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                The whitelist restricts which addresses an agent can pay.
                Every outgoing transaction is checked against the whitelist
                — if the destination is not on the list, the transaction is
                rejected. This prevents agents from sending funds to
                unauthorized addresses, even if they are compromised.
              </p>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Whitelist entries are stored in a dedicated PDA per
                sub-account. The vault owner can add or remove entries at
                any time. Each entry can optionally include a label for
                human-readable identification.
              </p>

              <Code title="whitelist.rs">
{`pub fn add_to_whitelist(
    ctx: Context<ModifyWhitelist>,
    address: Pubkey,
    label: String,
) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    require!(
        !whitelist.entries.iter().any(|e| e.address == address),
        VaultError::AlreadyWhitelisted
    );
    whitelist.entries.push(WhitelistEntry {
        address,
        label,
        added_at: Clock::get()?.unix_timestamp,
    });

    msg!("Address {} added to whitelist", address);
    Ok(())
}

// Checked during payment execution
pub fn verify_whitelist(
    whitelist: &Whitelist,
    destination: &Pubkey,
) -> Result<()> {
    require!(
        whitelist.entries.iter().any(|e| e.address == *destination),
        VaultError::NotWhitelisted
    );
    Ok(())
}`}
              </Code>

              <Code title="TypeScript SDK">
{`// Add addresses to the whitelist
await subAccount.addToWhitelist([
  { address: "4zMMC9...openai", label: "OpenAI API" },
  { address: "7xKm3...claude", label: "Claude API" },
  { address: "9pRt7...market", label: "Market Data" },
]);

// Remove an address
await subAccount.removeFromWhitelist("4zMMC9...openai");

// List all whitelisted addresses
const entries = await subAccount.getWhitelist();
entries.forEach((e) => console.log(\`\${e.label}: \${e.address}\`));`}
              </Code>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Time Rules ── */}
            <section id="time-rules" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Time Rules
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Time rules restrict when an agent is allowed to spend. You
                define time windows in UTC — for example, 09:00 to 17:00 on
                weekdays only. The Solana clock (on-chain{" "}
                <code className="text-[13px] font-mono text-neutral-300 bg-white/[0.04] px-1.5 py-0.5 rounded">
                  Clock::get()
                </code>
                ) is used as the source of truth, so enforcement works even
                if the agent&apos;s server is offline or tampered with.
              </p>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Multiple time windows can be configured per sub-account.
                Outside of all defined windows, transactions are rejected.
              </p>

              <Code title="time_rules.rs">
{`#[account]
pub struct TimeRule {
    pub sub_account: Pubkey,
    pub windows: Vec<TimeWindow>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TimeWindow {
    pub start_hour: u8,   // 0-23 UTC
    pub end_hour: u8,     // 0-23 UTC
    pub days: Vec<u8>,    // 0=Sun, 1=Mon, ..., 6=Sat
}

pub fn check_time_rules(time_rule: &TimeRule) -> Result<()> {
    let clock = Clock::get()?;
    let ts = clock.unix_timestamp;

    let hour = ((ts % 86_400) / 3_600) as u8;
    let day = ((ts / 86_400 + 4) % 7) as u8; // Unix epoch was Thursday

    let allowed = time_rule.windows.iter().any(|w| {
        w.days.contains(&day) && hour >= w.start_hour && hour < w.end_hour
    });

    require!(allowed, VaultError::OutsideTimeWindow);
    Ok(())
}`}
              </Code>

              <Code title="TypeScript SDK">
{`await subAccount.setTimeRules({
  windows: [
    {
      startHour: 9,
      endHour: 17,
      days: [1, 2, 3, 4, 5], // Mon–Fri
    },
  ],
});

// Check if the agent can transact right now
const canSpend = await subAccount.isWithinTimeWindow();
console.log("Can spend:", canSpend); // => true or false`}
              </Code>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Auto Top-Up ── */}
            <section id="auto-top-up" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Auto Top-Up
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                Auto top-up ensures sub-accounts never run dry. You set a
                minimum balance threshold — when the sub-account drops
                below that threshold, the vault automatically refills it
                from the main pool up to a predefined target balance. This
                runs as a permissionless crank: anyone can invoke the
                top-up instruction, but the rules are enforced on-chain.
              </p>

              <Code title="auto_topup.rs">
{`#[account]
pub struct AutoTopUp {
    pub sub_account: Pubkey,
    pub min_balance: u64,     // trigger threshold
    pub target_balance: u64,  // refill to this amount
    pub enabled: bool,
    pub last_topup: i64,
    pub bump: u8,
}

pub fn execute_topup(ctx: Context<ExecuteTopUp>) -> Result<()> {
    let config = &ctx.accounts.auto_topup;
    let sub = &mut ctx.accounts.sub_account;
    let vault = &mut ctx.accounts.vault;

    require!(config.enabled, VaultError::TopUpDisabled);
    require!(sub.balance() < config.min_balance, VaultError::AboveThreshold);

    let refill = config.target_balance - sub.balance();
    require!(vault.balance >= refill, VaultError::InsufficientVaultFunds);

    vault.balance -= refill;
    sub.credit(refill);

    msg!("Top-up: {} lamports → {}", refill, sub.agent_id);
    Ok(())
}`}
              </Code>

              <Code title="TypeScript SDK">
{`await subAccount.configureAutoTopUp({
  minBalance: 500_000_000,    // trigger when below 0.5 SOL
  targetBalance: 2_000_000_000, // refill to 2 SOL
  enabled: true,
});

// Run the crank (permissionless — anyone can call this)
await vault.crankAutoTopUp(subAccount.address);`}
              </Code>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── Multi-Sig ── */}
            <section id="multi-sig" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                Multi-Sig
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                For high-value operations, you can require multiple
                signatures before a transaction is executed. Multi-sig is
                configured at the vault level and applies to operations
                above a defined threshold. Common configurations include
                2-of-3 and 3-of-5. Signers are defined on-chain and can
                be updated by the vault authority.
              </p>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                When a multi-sig payment is initiated, a proposal account is
                created. Each required signer submits an approval. Once the
                threshold is met, anyone can finalize the transaction.
                Proposals expire after a configurable TTL.
              </p>

              <Code title="multisig.rs">
{`#[account]
pub struct MultisigConfig {
    pub vault: Pubkey,
    pub signers: Vec<Pubkey>,
    pub threshold: u8,         // e.g. 2 for 2-of-3
    pub amount_threshold: u64, // multi-sig required above this amount
    pub proposal_ttl: i64,     // seconds until proposal expires
    pub bump: u8,
}

#[account]
pub struct Proposal {
    pub vault: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
    pub approvals: Vec<Pubkey>,
    pub created_at: i64,
    pub executed: bool,
    pub bump: u8,
}

pub fn approve_proposal(ctx: Context<ApproveProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let config = &ctx.accounts.multisig_config;
    let signer = ctx.accounts.signer.key();

    require!(
        config.signers.contains(&signer),
        VaultError::NotAuthorizedSigner
    );
    require!(
        !proposal.approvals.contains(&signer),
        VaultError::AlreadyApproved
    );

    proposal.approvals.push(signer);

    if proposal.approvals.len() >= config.threshold as usize {
        msg!("Threshold met — proposal ready for execution");
    }
    Ok(())
}`}
              </Code>

              <Code title="TypeScript SDK">
{`// Configure multi-sig
await vault.configureMultisig({
  signers: [wallet1.publicKey, wallet2.publicKey, wallet3.publicKey],
  threshold: 2,                    // 2-of-3
  amountThreshold: 5_000_000_000,  // require multi-sig above 5 SOL
  proposalTtl: 86_400,             // 24 hour expiry
});

// Create a proposal
const proposal = await vault.createProposal({
  destination: "9pRt7...vendor",
  amount: 10_000_000_000, // 10 SOL
});

// Each signer approves
await proposal.approve(wallet1);
await proposal.approve(wallet2); // threshold met

// Execute
await proposal.execute();`}
              </Code>
            </section>

            <hr className="my-14 border-white/[0.06]" />

            {/* ── API Reference ── */}
            <section id="api-reference" className="scroll-mt-24">
              <h2 className="text-[24px] font-bold tracking-tight">
                API Reference
              </h2>
              <p className="text-[14px] text-neutral-400 leading-[1.8] mt-4">
                The MPP Vault TypeScript SDK provides a high-level interface
                over the on-chain program. It handles PDA derivation,
                account serialization, transaction building, and
                confirmation — so you can interact with vaults using clean,
                typed method calls.
              </p>

              <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-4 py-3 font-medium text-neutral-400">
                        Method
                      </th>
                      <th className="px-4 py-3 font-medium text-neutral-400">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {[
                      ["MppVault.create()", "Deploy a new vault PDA"],
                      ["vault.createSubAccount()", "Create an agent sub-account"],
                      ["subAccount.setSpendingRules()", "Set max per tx / per day limits"],
                      ["subAccount.addToWhitelist()", "Whitelist destination addresses"],
                      ["subAccount.setTimeRules()", "Configure time window restrictions"],
                      ["subAccount.configureAutoTopUp()", "Set auto-refill thresholds"],
                      ["vault.configureMultisig()", "Set up multi-sig approval flow"],
                      ["vault.createProposal()", "Initiate a multi-sig payment"],
                      ["proposal.approve()", "Submit a signer approval"],
                      ["proposal.execute()", "Finalize an approved proposal"],
                    ].map(([method, desc]) => (
                      <tr key={method} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 font-mono text-[var(--accent)]">
                          {method}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-400">
                          {desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 rounded-xl border border-[var(--accent)]/[0.12] bg-[var(--accent)]/[0.04] p-5">
                <p className="text-[13px] text-[var(--accent)] font-medium mb-1">
                  SDK available now
                </p>
                <p className="text-[13px] text-neutral-400 leading-[1.7]">
                  The Agent SDK is available as <code className="text-[12px] font-mono text-neutral-300 bg-white/[0.04] px-1.5 py-0.5 rounded">mpp-vault-sdk</code> on npm. See the <a href="#agent-sdk" className="text-[var(--accent)] hover:underline">Agent SDK section</a> for usage examples.
                </p>
              </div>

              <Code title="Install">
{`npm install mpp-vault-sdk @solana/web3.js`}
              </Code>
            </section>

            {/* ── bottom nav ── */}
            <div className="mt-20 pt-10 border-t border-white/[0.06] flex items-center justify-between">
              <Link
                href="/"
                className="text-[13px] text-neutral-500 hover:text-white transition-colors"
              >
                ← Back to home
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-black bg-[var(--accent)] rounded-full px-5 py-2 hover:brightness-110 transition-all"
              >
                Open Dashboard →
              </Link>
            </div>

            {/* spacer */}
            <div className="h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
