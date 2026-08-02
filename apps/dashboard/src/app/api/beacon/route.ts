import { ingestAiTrafficEvents } from "@notra/analytics/tinybird/client";
import { toClickHouseDateTime } from "@notra/analytics/utils/datetime";
import { type NextRequest, NextResponse } from "next/server";
import { verifyBeaconToken } from "@/lib/beacon/token";
import { beaconEventSchema } from "@/schemas/geo";
import { getClientIp, ratelimit } from "@/utils/ratelimit";

const NO_STORE = { "Cache-Control": "no-store" };

function toCapturedAt(ts: string): string {
  const parsed = new Date(ts);
  return toClickHouseDateTime(
    Number.isNaN(parsed.getTime()) ? new Date() : parsed
  );
}

export async function POST(request: NextRequest) {
  const { success } = await ratelimit.beaconIngest.limit(getClientIp(request));
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: NO_STORE }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = beaconEventSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400, headers: NO_STORE }
    );
  }

  const event = parsed.data;
  if (!verifyBeaconToken(event.organizationId, event.token)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE }
    );
  }

  await ingestAiTrafficEvents([
    {
      organization_id: event.organizationId,
      agent: event.agent,
      category: event.category,
      confidence: event.confidence,
      path: event.path,
      host: event.host,
      method: event.method.toUpperCase(),
      referer: event.referer,
      captured_at: toCapturedAt(event.ts),
    },
  ]);

  return NextResponse.json({ ok: true }, { status: 202, headers: NO_STORE });
}
