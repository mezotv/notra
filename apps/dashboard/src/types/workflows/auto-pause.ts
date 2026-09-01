import type { WorkflowPausedReason } from "@notra/email/types/workflow-paused";

export type AutomatedWorkflowPauseReason = Extract<
  WorkflowPausedReason,
  "ai_credits_depleted" | "plan_limit_reached" | "workflow_errors"
>;

export interface RecordAutomatedWorkflowPauseParams {
  triggerId: string;
  organizationId: string;
  automationName: string;
  reason: AutomatedWorkflowPauseReason;
  logPrefix: string;
}

export interface ClearAutomatedWorkflowPauseStateParams {
  triggerId: string;
}
