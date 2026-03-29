import { NextRequest, NextResponse } from "next/server";
import type { AgentCatalogEntry, CatalogRegistration } from "@/lib/catalog";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "catalog.json");

async function readStore(): Promise<AgentCatalogEntry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeStore(entries: AgentCatalogEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const capability = searchParams.get("capability");
  const address = searchParams.get("address");

  let entries = await readStore();

  if (address) {
    entries = entries.filter((e) => e.subAccountAddress === address);
  }

  if (capability) {
    entries = entries.filter((e) =>
      e.capabilities.some(
        (c) => c.toLowerCase() === capability.toLowerCase(),
      ),
    );
  }

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  let body: CatalogRegistration;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (
    !body.subAccountAddress ||
    !body.agentName ||
    !body.capabilities?.length
  ) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: subAccountAddress, agentName, capabilities",
      },
      { status: 400 },
    );
  }

  const entries = await readStore();
  const now = new Date().toISOString();

  const existingIdx = entries.findIndex(
    (e) => e.subAccountAddress === body.subAccountAddress,
  );

  const entry: AgentCatalogEntry = {
    subAccountAddress: body.subAccountAddress,
    agentName: body.agentName,
    agentId: body.agentId || "",
    description: body.description || "",
    endpoint: body.endpoint || "",
    capabilities: body.capabilities,
    rateCards: body.rateCards || [],
    sla: body.sla || { uptimePercent: 99, avgResponseMs: 500, maxResponseMs: 5000 },
    createdAt: existingIdx >= 0 ? entries[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.push(entry);
  }

  await writeStore(entries);

  return NextResponse.json(entry, { status: existingIdx >= 0 ? 200 : 201 });
}
