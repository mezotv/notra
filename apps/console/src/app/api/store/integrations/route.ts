import { NextResponse } from "next/server";

import { STORE_CACHE_CONTROL_HEADER } from "@/constants/store";
import { listPublicStoreIntegrations } from "@/lib/store/public-integrations";

export async function GET() {
  try {
    const integrations = await listPublicStoreIntegrations();
    return NextResponse.json(
      { integrations },
      { headers: { "Cache-Control": STORE_CACHE_CONTROL_HEADER } }
    );
  } catch (error) {
    console.error("[Store] Failed to list integrations", error);
    return NextResponse.json(
      { error: "Could not load integrations" },
      { status: 500 }
    );
  }
}
