import { executeAgentReadinessScan } from "@/lib/geo/agent-readiness";
import type {
  AgentReadinessWorkflowPayload,
  AgentReadinessWorkflowResult,
} from "@/types/agent-readiness";

export async function runAgentReadinessScanStep(
  payload: AgentReadinessWorkflowPayload
): Promise<AgentReadinessWorkflowResult> {
  "use step";
  return await executeAgentReadinessScan(payload);
}
