"use client";

import { useVault } from "@/lib/useVault";

const steps = [
  {
    num: "01",
    title: "Connect wallet",
    desc: "Connect your Solana wallet (e.g. Phantom). This is your vault owner identity — only you can manage the vault.",
    done: (ctx: { connected: boolean }) => ctx.connected,
  },
  {
    num: "02",
    title: "Deploy vault",
    desc: 'Click "deploy vault" on the overview page. This creates a program-derived address (PDA) on Solana that holds all funds and rules. One transaction, done in seconds.',
    done: (ctx: { isOnChain: boolean }) => ctx.isOnChain,
  },
  {
    num: "03",
    title: "Create sub-accounts",
    desc: "Each AI agent gets its own sub-account with a name, agent ID, and USDC budget. Go to sub-accounts → + new. The agent can only spend within its budget.",
    done: (ctx: { hasSubAccounts: boolean }) => ctx.hasSubAccounts,
  },
  {
    num: "04",
    title: "Set spending rules",
    desc: "Configure limits for each sub-account: max per transaction, max per day, time windows (e.g. only 9am–5pm). All enforced on-chain — no server needed.",
    done: () => false,
  },
  {
    num: "05",
    title: "Whitelist recipients",
    desc: "Add approved addresses that the agent can pay. If an agent tries to pay an address not on the whitelist, the blockchain rejects it.",
    done: () => false,
  },
  {
    num: "06",
    title: "Deposit USDC",
    desc: "Transfer USDC from your wallet into the vault. The balance is distributed across sub-accounts based on their budgets.",
    done: () => false,
  },
  {
    num: "07",
    title: "Let agents transact",
    desc: "Give each agent its sub-account address and your vault program ID. The agent calls execute_payment to pay for services — rules are checked automatically on-chain.",
    done: () => false,
  },
];

const concepts = [
  {
    title: "What is a vault?",
    body: "A vault is a smart contract account on Solana that holds USDC and enforces spending rules. It's controlled by your wallet (the authority). Think of it as a company bank account that only you can configure.",
  },
  {
    title: "What are sub-accounts?",
    body: "Each AI agent gets its own sub-account inside your vault. A sub-account has its own budget, spending limits, and whitelist. Agents can only access their own sub-account — they can't touch other agents' funds.",
  },
  {
    title: "How do spending rules work?",
    body: "Rules are stored as on-chain account data. When an agent calls execute_payment, the Solana program checks: Is the amount under the per-tx limit? Under the daily limit? Is the recipient whitelisted? Is it within the time window? If any check fails, the transaction is rejected by the blockchain itself.",
  },
  {
    title: "What is a whitelist?",
    body: "A list of approved Solana addresses that an agent is allowed to pay. For example, you might whitelist the OpenAI API payment address and a data provider. The agent cannot send USDC to any address not on this list.",
  },
  {
    title: "Why on-chain?",
    body: "Because rules enforced by a server require you to trust that server. If it goes down, gets hacked, or the operator is malicious, your rules stop working. On-chain rules are enforced by the Solana blockchain — they work 24/7 regardless of any server.",
  },
  {
    title: "How do agents connect?",
    body: "An agent is any script/bot that has a Solana keypair. You give the agent: (1) your vault program ID, (2) its sub-account address, and (3) a keypair to sign transactions. The agent builds and sends execute_payment transactions to the Solana network.",
  },
  {
    title: "What about fees?",
    body: "MPP Vault charges 0% fees. The only cost is Solana transaction fees (fractions of a cent per transaction). The protocol takes nothing from your payments.",
  },
];

export default function GuidePage() {
  const { connected, isOnChain, subAccounts } = useVault();

  const ctx = {
    connected,
    isOnChain,
    hasSubAccounts: subAccounts.length > 0,
  };

  return (
    <div>
      <div>
        <h1 className="text-[clamp(22px,2vw,28px)] font-bold tracking-[-0.03em]">
          guide
        </h1>
        <p className="mt-1 text-[13px] text-neutral-400">
          how mpp vault works and how to get started.
        </p>
      </div>

      {/* Getting started steps */}
      <div className="mt-8">
        <h2 className="text-[13px] font-semibold tracking-tight text-white mb-4">
          getting started
        </h2>
        <div className="space-y-3">
          {steps.map((step) => {
            const isDone = step.done(ctx);
            return (
              <div
                key={step.num}
                className={`liquid-glass rounded-2xl p-5 transition-all ${
                  isDone ? "border-[var(--accent)]/20" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 ${
                      isDone
                        ? "bg-[var(--accent)]/[0.15] text-[var(--accent)]"
                        : "bg-white/[0.04] text-neutral-500"
                    }`}
                  >
                    {isDone ? "✓" : step.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-[14px] font-medium ${
                          isDone ? "text-[var(--accent)]" : "text-white"
                        }`}
                      >
                        {step.title}
                      </h3>
                      {isDone && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full text-[var(--accent)] bg-[var(--accent)]/[0.10]">
                          done
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-neutral-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concepts */}
      <div className="mt-12">
        <h2 className="text-[13px] font-semibold tracking-tight text-white mb-4">
          key concepts
        </h2>
        <div className="space-y-3">
          {concepts.map((c) => (
            <div key={c.title} className="liquid-glass rounded-2xl p-5">
              <h3 className="text-[14px] font-medium text-white">
                {c.title}
              </h3>
              <p className="mt-2 text-[13px] text-neutral-400 leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Agent integration example */}
      <div className="mt-12">
        <h2 className="text-[13px] font-semibold tracking-tight text-white mb-4">
          agent integration example
        </h2>
        <div className="liquid-glass rounded-2xl p-5">
          <p className="text-[13px] text-neutral-400 mb-4">
            Here&apos;s how an AI agent calls your vault to make a payment.
            This runs on the agent&apos;s server — not in the dashboard.
          </p>
          <pre className="bg-black/40 border border-white/[0.06] rounded-xl p-4 text-[12px] text-neutral-300 font-mono overflow-x-auto leading-relaxed">
{`import { Connection, PublicKey, Transaction } from "@solana/web3.js";

const VAULT_PROGRAM = new PublicKey("your-program-id");
const SUB_ACCOUNT  = new PublicKey("agent-sub-account");
const RECIPIENT    = new PublicKey("whitelisted-service");

// Build the execute_payment instruction
const ix = buildExecutePayment({
  vault: VAULT_PDA,
  subAccount: SUB_ACCOUNT,
  recipient: RECIPIENT,
  amount: 5_000_000, // 5 USDC (6 decimals)
});

// Sign with agent's keypair and send
const tx = new Transaction().add(ix);
tx.sign(agentKeypair);
await connection.sendTransaction(tx);

// If rules pass → payment goes through
// If rules fail → transaction rejected on-chain`}
          </pre>
        </div>
      </div>
    </div>
  );
}
