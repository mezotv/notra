import { executeAgentReadinessScan } from "@notra/geo-core/geo/agent-readiness";
import type {
  AgentReadinessWorkflowPayload,
  AgentReadinessWorkflowResult,
} from "@notra/geo-core/types/agent-readiness";

import { trackAgentReadinessScanResult } from "@/lib/analytics/geo-workflow-events";

export async function runAgentReadinessScanStep(
  payload: AgentReadinessWorkflowPayload
): Promise<AgentReadinessWorkflowResult> {
  "use step";
  const startedAt = Date.now();
  const result = await executeAgentReadinessScan(payload);
  await trackAgentReadinessScanResult({
    payload,
    status: result.status,
    reason: result.status === "failed" ? result.reason : undefined,
    durationMs: Date.now() - startedAt,
  });
  return result;
}
