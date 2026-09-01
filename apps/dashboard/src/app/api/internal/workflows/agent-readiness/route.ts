import { agentReadinessWorkflowPayloadSchema } from "@notra/geo-core/schemas/agent-readiness";

import { verifyInternalWorkflowRequest } from "@/lib/workflows/internal-auth";
import { startAgentReadinessRun } from "@/lib/workflows/start";
import { ratelimit } from "@/utils/ratelimit";

/** Starts the agent readiness workflow on behalf of the public API. */
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

  const parsed = agentReadinessWorkflowPayloadSchema.safeParse(body);
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

  const { runId } = await startAgentReadinessRun(parsed.data);
  return Response.json({ runId }, { status: 202 });
}
