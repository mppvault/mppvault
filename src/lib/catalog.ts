export interface RateCard {
  capability: string;
  priceUsdc: number;
  unit: string;
}

export interface AgentCatalogEntry {
  subAccountAddress: string;
  agentName: string;
  agentId: string;
  description: string;
  endpoint: string;
  capabilities: string[];
  rateCards: RateCard[];
  sla: {
    uptimePercent: number;
    avgResponseMs: number;
    maxResponseMs: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CatalogRegistration {
  subAccountAddress: string;
  agentName: string;
  agentId: string;
  description: string;
  endpoint: string;
  capabilities: string[];
  rateCards: RateCard[];
  sla: {
    uptimePercent: number;
    avgResponseMs: number;
    maxResponseMs: number;
  };
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export async function fetchCatalog(): Promise<AgentCatalogEntry[]> {
  const res = await fetch(`${getBaseUrl()}/api/catalog`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCatalogByCapability(
  capability: string,
): Promise<AgentCatalogEntry[]> {
  const res = await fetch(
    `${getBaseUrl()}/api/catalog?capability=${encodeURIComponent(capability)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAgentCatalog(
  subAccountAddress: string,
): Promise<AgentCatalogEntry | null> {
  const res = await fetch(
    `${getBaseUrl()}/api/catalog?address=${encodeURIComponent(subAccountAddress)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const entries: AgentCatalogEntry[] = await res.json();
  return entries[0] ?? null;
}

export async function registerCatalogEntry(
  entry: CatalogRegistration,
): Promise<AgentCatalogEntry> {
  const res = await fetch(`${getBaseUrl()}/api/catalog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to register catalog entry");
  }
  return res.json();
}

export const ALL_CAPABILITIES = [
  "text-generation",
  "image-generation",
  "code-generation",
  "data-analysis",
  "web-search",
  "translation",
  "summarization",
  "embedding",
  "speech-to-text",
  "text-to-speech",
  "classification",
  "reasoning",
  "tool-use",
  "custom",
] as const;

export type Capability = (typeof ALL_CAPABILITIES)[number];
