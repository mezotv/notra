import { Badge } from "@notra/ui/components/ui/badge";
import {
  AGENT_FEEDBACK_KIND_LABELS,
  AGENT_FEEDBACK_STATUS_LABELS,
} from "@/constants/agent-feedback";
import type {
  AgentFeedbackKindBadgeProps,
  AgentFeedbackStatusBadgeProps,
} from "@/types/agent-feedback";

export function AgentFeedbackStatusBadge({
  status,
}: AgentFeedbackStatusBadgeProps) {
  if (status === "new") {
    return <Badge>{AGENT_FEEDBACK_STATUS_LABELS[status]}</Badge>;
  }
  if (status === "archived") {
    return (
      <Badge variant="outline">{AGENT_FEEDBACK_STATUS_LABELS[status]}</Badge>
    );
  }
  return (
    <Badge variant="secondary">{AGENT_FEEDBACK_STATUS_LABELS[status]}</Badge>
  );
}

export function AgentFeedbackKindBadge({ kind }: AgentFeedbackKindBadgeProps) {
  if (kind === "bug") {
    return (
      <Badge variant="destructive">{AGENT_FEEDBACK_KIND_LABELS[kind]}</Badge>
    );
  }
  return <Badge variant="outline">{AGENT_FEEDBACK_KIND_LABELS[kind]}</Badge>;
}
