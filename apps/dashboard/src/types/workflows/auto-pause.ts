import type { WorkflowPausedReason } from "@notra/email/types/workflow-paused";

export type AutomatedWorkflowPauseReason = Extract<
  WorkflowPausedReason,
  "ai_credits_depleted" | "workflow_errors"
>;

export interface RecordAutomatedWorkflowPauseParams {
  triggerId: string;
  organizationId: string;
  automationName: string;
  reason: AutomatedWorkflowPauseReason;
  logPrefix: string;
}

export interface RecordAutomatedWorkflowPauseStepParams
  extends RecordAutomatedWorkflowPauseParams {
  manual: boolean;
  stepName: string;
}

export interface ClearAutomatedWorkflowPauseStateParams {
  triggerId: string;
}

export interface ClearAutomatedWorkflowPauseStateStepParams
  extends ClearAutomatedWorkflowPauseStateParams {
  manual: boolean;
  logPrefix: string;
  stepName: string;
}
