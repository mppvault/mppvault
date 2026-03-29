# MPP Vault

On-chain spending infrastructure for autonomous AI agents. Built on Solana.

## Overview

MPP Vault is a Solana program that gives AI agents a structured way to spend funds — with every rule enforced on-chain, not on a server. You deploy one vault, create sub-accounts for each agent, define spending constraints, and let the program handle the rest. No middleware. No private keys handed to agents. No trusted backend.

The program is deployed on Solana mainnet and verifiable by anyone.

**Program ID:** `2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx`  
**Explorer:** https://solscan.io/account/2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx

**$MVAULT**  
**CA:** `7XPPpKEwNBSA446MxzrCkeT1CytFK1bCiXQWzmFzpump`

The full program source is in this repository. The deployed bytecode on Solana mainnet corresponds directly to this code. Full transparency — the smart contract, the frontend, and the deployment config are all here.

## How It Works

### Vault

A vault is a Program Derived Address (PDA) on Solana. No private key exists for it. Only the on-chain program can authorize token transfers from it. The vault owner is the wallet that deployed it — only that wallet can modify vault configuration.

### Sub-accounts

Each agent gets its own sub-account inside the vault. A sub-account holds a balance, tracks spending, and carries its own set of rules. Sub-accounts can be created, paused, resumed, or closed at any time by the vault owner.

### Rules

Rules are stored as on-chain account data. They are not configuration in a database — they are validated by the program at the instruction level before any token transfer executes.

Each sub-account supports:

- **Per-transaction limit** — maximum amount allowed in a single payment
- **Daily spending cap** — resets automatically every 24 hours using Solana Clock
- **Recipient whitelist** — agents can only pay pre-approved addresses
- **Time windows** — restrict transactions to specific hours of the day
- **Auto top-up** — automatically refill balance when it drops below a threshold

### Payment Execution

When an agent calls `execute_payment`, the program runs the following checks in sequence:

1. Sub-account status is `Active`
2. Amount is within the per-transaction limit
3. Current time is within the allowed window (if configured)
4. Daily spending cap is not exceeded (auto-resets on-chain)
5. Recipient is on the sub-account whitelist
6. Sub-account has sufficient balance

If any check fails, the transaction is rejected atomically. Nothing moves. If all checks pass, the program signs a token transfer from the vault PDA to the recipient and updates balance, spent, and transaction count on-chain.

## Program Instructions

| Instruction | Description |
|---|---|
| `create_vault` | Deploy a new vault PDA |
| `create_sub_account` | Create an agent sub-account with a total budget |
| `deposit` | Add USDC to the vault |
| `withdraw` | Withdraw USDC from the vault |
| `execute_payment` | Agent initiates a payment (checked against all rules) |
| `set_spending_rules` | Configure per-tx and daily limits |
| `set_time_rules` | Configure time window restrictions |
| `configure_auto_topup` | Enable automatic balance top-up |
| `add_whitelist` | Add an approved recipient address |
| `remove_whitelist` | Remove a recipient from the whitelist |
| `pause_sub_account` | Disable all payments from a sub-account |
| `resume_sub_account` | Re-enable a paused sub-account |

## Architecture

```
Vault Owner (wallet)
└── Vault (PDA)
    ├── Sub-account 1  [agent_id, balance, rules, whitelist]
    ├── Sub-account 2  [agent_id, balance, rules, whitelist]
    └── Sub-account N  [agent_id, balance, rules, whitelist]
```

Funds are held by the vault PDA. Sub-accounts track individual agent budgets and constraints. Whitelist entries are separate PDAs keyed by sub-account and recipient address.

## Transparency

The program is open source. The deployed bytecode on Solana mainnet corresponds directly to this repository. All vault state — balances, rules, whitelist entries, transaction counts — is readable on-chain by anyone with an RPC connection.

There is no admin key. There is no fee. There is no upgrade authority that can change program behavior after deployment.

## Running Locally

```bash
npm install
cp .env.example .env.local
# Add your Solana RPC URL and program ID to .env.local
npm run dev
```

Open `http://localhost:3000` to access the dashboard.

## Environment Variables

```
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_VAULT_PROGRAM_ID=2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx
```

## Tech Stack

- **Solana program** — Rust, Anchor 0.32.1
- **Frontend** — Next.js 16, TypeScript, Tailwind CSS
- **Wallet** — Phantom via `@solana/wallet-adapter`
- **Token** — USDC (SPL Token)

## Links

- Website: https://mppvault.fun
- Program: https://solscan.io/account/2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx
- X: https://x.com/MPPVault
