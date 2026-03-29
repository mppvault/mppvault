# mpp-vault-sdk

TypeScript SDK for [MPP Vault](https://github.com/mppvault/mppvault) — agent-to-agent USDC payments on Solana.

## Install

```bash
npm install mpp-vault-sdk @solana/web3.js
```

## Quick Start

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { MppVaultSDK } from "mpp-vault-sdk";

const sdk = new MppVaultSDK({
  connection: new Connection("https://api.mainnet-beta.solana.com"),
  agentKeypair: Keypair.fromSecretKey(/* ... */),
});

// Execute a payment
const result = await sdk.pay(
  "YOUR_SUB_ACCOUNT_ADDRESS",
  "RECIPIENT_ADDRESS",
  5.00, // USDC
);
console.log("Tx:", result.signature);
```

## API

### `new MppVaultSDK(config)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `connection` | `Connection` | Solana RPC connection |
| `programId` | `PublicKey \| string` | Optional. Defaults to mainnet program |
| `agentKeypair` | `Keypair` | Agent keypair for signing transactions |

### `sdk.pay(subAccount, recipient, amount)`

Execute a USDC payment from a sub-account to a whitelisted recipient.

Returns `{ signature, amount, recipient }`.

### `sdk.canPay(subAccount, amount)`

Pre-check if a payment will succeed. Checks balance, per-tx limit, daily limit, and account status.

Returns `{ allowed: boolean, reason?: string }`.

### `sdk.getSubAccount(address)`

Read sub-account state from on-chain data.

Returns `SubAccountInfo` with balance, spent, rules, status, and transaction count.

## Requirements

- The recipient must be whitelisted on the sub-account
- The agent keypair needs ~0.01 SOL for transaction fees
- Funds come from the sub-account, not the agent wallet

## Links

- [MPP Vault](https://github.com/mppvault/mppvault)
- [Documentation](https://mppvault.com/docs)
- [Agent Registry](https://mppvault.com/registry)
