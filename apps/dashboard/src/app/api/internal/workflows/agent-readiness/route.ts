import {
  AGENT_READINESS_UNAVAILABLE_DESCRIPTION,
  FEATURE_NOT_ENABLED_CODE,
} from "@notra/geo-core/constants/agent-readiness";
import { agentReadinessWorkflowPayloadSchema } from "@notra/geo-core/schemas/agent-readiness";

import { isAgentReadinessEnabledForOrganization } from "@/lib/geo/agent-readiness-flag";
import { verifyInternalWorkflowRequest } from "@/lib/workflows/internal-auth";
import { startAgentReadinessRun } from "@/lib/workflows/start";
import { ratelimit } from "@/utils/ratelimit";

/**
 * Starts the agent readiness workflow on behalf of the public API, and is the
 * one place where the Databuddy feature flag is enforced for API callers.
 *
 * The flag is resolved through the dashboard's flag provider, which the API
 * process does not have. Rather than let the API guess (it would have to assume
 * "enabled" and hand out a feature the organization has not been granted), the
 * check happens here, on the start path, exactly as `geo.agentReadinessScan`
 * does it. A refusal comes back as a 403 carrying `FEATURE_NOT_ENABLED`, which
 * the API turns into its own 403.
 *
 * Reads are deliberately not gated: `GET .../geo/agent-readiness` only returns
 * rows this organization already produced, and withholding stored data behind a
 * rollout flag would hide the customer's own history.
 */
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

  const enabled = await isAgentReadinessEnabledForOrganization(
    parsed.data.organizationId
  );
  if (!enabled) {
    return Response.json(
      {
        error: AGENT_READINESS_UNAVAILABLE_DESCRIPTION,
        code: FEATURE_NOT_ENABLED_CODE,
      },
      { status: 403 }
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
