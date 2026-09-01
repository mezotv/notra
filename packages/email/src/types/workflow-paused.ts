export type WorkflowPausedReason =
  | "ai_credits_depleted"
  | "plan_limit_reached"
  | "workflow_errors";

export interface WorkflowPausedEmailProps {
  organizationName: string;
  organizationSlug: string;
  automationName: string;
  reason: WorkflowPausedReason;
  settingsLink: string;
}
