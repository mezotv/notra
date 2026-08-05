import { getAppUrl } from "@notra/ai/qstash/triggers";
import { flattenError } from "zod";
import { verifyQstashSignature } from "@/lib/workflows/qstash-verify";
import { startGeoScanRun } from "@/lib/workflows/start";
import { geoScanPayloadSchema } from "@/schemas/geo";

const ROUTE_PATH = "/api/workflows/geo-scan";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = await verifyQstashSignature({
    request,
    rawBody,
    url: `${getAppUrl()}${ROUTE_PATH}`,
  });
  if (!verified) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown = {};
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }
  }

  const parsed = geoScanPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[GEO] Invalid scan payload:", flattenError(parsed.error));
    return new Response("Invalid payload", { status: 400 });
  }

  const { runId } = await startGeoScanRun(parsed.data);
  return Response.json({ runId }, { status: 202 });
}
