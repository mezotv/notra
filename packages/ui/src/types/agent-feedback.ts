export type AgentFeedbackKind =
  | "bug"
  | "feature"
  | "praise"
  | "question"
  | "other";

export type AgentFeedbackStatus = "new" | "triaged" | "resolved" | "archived";

export interface AgentFeedbackStatusBadgeProps {
  status: AgentFeedbackStatus;
}

export interface AgentFeedbackKindBadgeProps {
  kind: AgentFeedbackKind;
}
