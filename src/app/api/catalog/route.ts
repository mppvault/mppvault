import { NextRequest, NextResponse } from "next/server";
import type { AgentCatalogEntry, CatalogRegistration } from "@/lib/catalog";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const capability = searchParams.get("capability");
  const address = searchParams.get("address");

  const supabase = getSupabase();

  let query = supabase.from("catalog").select("*");

  if (address) {
    query = query.eq("sub_account_address", address);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let entries: AgentCatalogEntry[] = (data ?? []).map(rowToEntry);

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

  const supabase = getSupabase();

  const row = {
    sub_account_address: body.subAccountAddress,
    agent_name: body.agentName,
    agent_id: body.agentId || "",
    description: body.description || "",
    endpoint: body.endpoint || "",
    capabilities: body.capabilities,
    rate_cards: body.rateCards || [],
    sla_uptime_percent: body.sla?.uptimePercent ?? 99,
    sla_avg_response_ms: body.sla?.avgResponseMs ?? 500,
    sla_max_response_ms: body.sla?.maxResponseMs ?? 5000,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("catalog")
    .upsert(row, { onConflict: "sub_account_address" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(rowToEntry(data), { status: 200 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEntry(row: any): AgentCatalogEntry {
  return {
    subAccountAddress: row.sub_account_address,
    agentName: row.agent_name,
    agentId: row.agent_id,
    description: row.description,
    endpoint: row.endpoint,
    capabilities: row.capabilities ?? [],
    rateCards: row.rate_cards ?? [],
    sla: {
      uptimePercent: row.sla_uptime_percent,
      avgResponseMs: row.sla_avg_response_ms,
      maxResponseMs: row.sla_max_response_ms,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
