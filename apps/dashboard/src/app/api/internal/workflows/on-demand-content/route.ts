import { contentGenerationWorkflowPayloadSchema } from "@notra/content-generation/schemas";

import { verifyInternalWorkflowRequest } from "@/lib/workflows/internal-auth";
import { startOnDemandRun } from "@/lib/workflows/start";
import { ratelimit } from "@/utils/ratelimit";

export async function POST(request: Request) {
  const authorized = await verifyInternalWorkflowRequest(request);
  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const parsed = contentGenerationWorkflowPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { success } = await ratelimit.internalWorkflowStart.limit(
    parsed.data.organizationId
  );
  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }

  const { runId } = await startOnDemandRun(parsed.data);
  return Response.json({ runId }, { status: 202 });
}
