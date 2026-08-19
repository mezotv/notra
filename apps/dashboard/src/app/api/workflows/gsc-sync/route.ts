import { getAppUrl } from "@notra/ai/qstash/triggers";
import { flattenError } from "zod";
import { GSC_SYNC_WORKFLOW_PATH } from "@/constants/google-search-console";
import { verifyQstashSignature } from "@/lib/workflows/qstash-verify";
import { startGscSyncRun } from "@/lib/workflows/start";
import { gscSyncPayloadSchema } from "@/schemas/google-search-console";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = await verifyQstashSignature({
    request,
    rawBody,
    url: `${getAppUrl()}${GSC_SYNC_WORKFLOW_PATH}`,
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

  const parsed = gscSyncPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[GSC] Invalid sync payload:", flattenError(parsed.error));
    return new Response("Invalid payload", { status: 400 });
  }

  const { runId } = await startGscSyncRun(parsed.data);
  return Response.json({ runId }, { status: 202 });
}
