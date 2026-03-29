# MPP Vault — Deploy Guide

## Prerequisites

1. **Rust** — https://rustup.rs
2. **Solana CLI** — https://docs.solana.com/cli/install-solana-cli-tools
3. **Anchor CLI** — `cargo install --git https://github.com/coral-xyz/anchor anchor-cli`

## Step 1: Generate a keypair (if you don't have one)

```bash
solana-keygen new -o ~/.config/solana/id.json
```

## Step 2: Configure Solana CLI for devnet

```bash
solana config set --url devnet
```

## Step 3: Get devnet SOL (for transaction fees)

```bash
solana airdrop 2
```

## Step 4: Build the program

```bash
cd programs/mpp-vault
anchor build
```

This compiles the Rust program and generates:
- `target/deploy/mpp_vault.so` (the compiled program)
- `target/deploy/mpp_vault-keypair.json` (program keypair)
- `target/idl/mpp_vault.json` (IDL for clients)

## Step 5: Get the program ID

```bash
solana address -k target/deploy/mpp_vault-keypair.json
```

Copy this address and update:
1. `programs/mpp-vault/src/lib.rs` → `declare_id!("YOUR_PROGRAM_ID")`
2. `Anchor.toml` → program IDs
3. `.env` → `NEXT_PUBLIC_VAULT_PROGRAM_ID=YOUR_PROGRAM_ID`

## Step 6: Rebuild with the correct program ID

```bash
anchor build
```

## Step 7: Deploy to devnet

```bash
anchor deploy --provider.cluster devnet
```

## Step 8: Test

Visit your frontend at `http://localhost:3000/dashboard`:
1. Connect Phantom wallet (set to devnet in Phantom settings)
2. Click "deploy vault"
3. Create sub-accounts, set rules, etc.

## Step 9: Deploy to mainnet (when ready)

```bash
solana config set --url mainnet-beta
anchor deploy --provider.cluster mainnet
```

Update `.env`:
```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```
