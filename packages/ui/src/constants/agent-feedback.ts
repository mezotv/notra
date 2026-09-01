import type {
  AgentFeedbackKind,
  AgentFeedbackStatus,
} from "@notra/ui/types/agent-feedback";

export const AGENT_FEEDBACK_STATUS_LABELS: Record<AgentFeedbackStatus, string> =
  {
    new: "New",
    triaged: "Triaged",
    resolved: "Resolved",
    archived: "Archived",
  };

export const AGENT_FEEDBACK_KIND_LABELS: Record<AgentFeedbackKind, string> = {
  bug: "Bug",
  feature: "Feature",
  praise: "Praise",
  question: "Question",
  other: "Other",
};
