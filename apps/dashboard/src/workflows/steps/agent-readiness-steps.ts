import { executeAgentReadinessScan } from "@notra/geo-core/geo/agent-readiness";
import type {
  AgentReadinessWorkflowPayload,
  AgentReadinessWorkflowResult,
} from "@notra/geo-core/types/agent-readiness";

export async function runAgentReadinessScanStep(
  payload: AgentReadinessWorkflowPayload
): Promise<AgentReadinessWorkflowResult> {
  "use step";
  return await executeAgentReadinessScan(payload);
}
