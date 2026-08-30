import { agentReadinessWorkflowPayloadSchema } from "@notra/geo-core/schemas/agent-readiness";
import type {
  AgentReadinessWorkflowPayload,
  AgentReadinessWorkflowResult,
} from "@notra/geo-core/types/agent-readiness";
import { flattenError } from "zod";

import { runAgentReadinessScanStep } from "./steps/agent-readiness-steps";

export async function agentReadinessWorkflow(
  payload: AgentReadinessWorkflowPayload
): Promise<AgentReadinessWorkflowResult> {
  "use workflow";

  const parseResult = agentReadinessWorkflowPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error(
      "[AgentReadiness] Invalid payload:",
      flattenError(parseResult.error)
    );
    return { status: "invalid_payload" };
  }

  return await runAgentReadinessScanStep(parseResult.data);
}
