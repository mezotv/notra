import { flattenError } from "zod";

import { agentReadinessWorkflowPayloadSchema } from "@/schemas/agent-readiness";
import type {
  AgentReadinessWorkflowPayload,
  AgentReadinessWorkflowResult,
} from "@/types/agent-readiness";

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
