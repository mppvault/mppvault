export interface SubAccount {
  id: string;
  name: string;
  agentId: string;
  balance: number;
  totalBudget: number;
  spent: number;
  maxPerTx: number;
  maxPerHour: number;
  maxPerDay: number;
  status: "active" | "paused" | "closed";
  whitelistCount: number;
  txCount: number;
  lastActive: string;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  autoTopUp: boolean;
  autoTopUpMin?: number;
  autoTopUpTarget?: number;
}

export interface Transaction {
  id: string;
  subAccountId: string;
  subAccountName: string;
  to: string;
  toLabel: string;
  amount: number;
  timestamp: string;
  status: "confirmed" | "pending" | "failed";
  signature: string;
}

export interface WhitelistEntry {
  address: string;
  label: string;
  addedAt: string;
}
