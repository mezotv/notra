import { cn } from "@notra/ui/lib/utils";

import { AgentFeedbackStatusIcon } from "@/components/agent-feedback/feedback-status-icon";
import {
  AGENT_FEEDBACK_KIND_DOT_CLASS,
  AGENT_FEEDBACK_KIND_LABELS,
  AGENT_FEEDBACK_KIND_PILL_CLASS,
  AGENT_FEEDBACK_LABEL_PILL_CLASS,
  AGENT_FEEDBACK_SENTIMENT_DOT_CLASS,
  AGENT_FEEDBACK_SENTIMENT_LABELS,
  AGENT_FEEDBACK_SENTIMENT_PILL_CLASS,
  AGENT_FEEDBACK_STATUS_LABELS,
} from "@/constants/agent-feedback";
import type {
  AgentFeedbackKindBadgeProps,
  AgentFeedbackSentimentLabelProps,
  AgentFeedbackStatusBadgeProps,
} from "@/types/agent-feedback";

export function AgentFeedbackStatusBadge({
  status,
  showLabel = true,
}: AgentFeedbackStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <AgentFeedbackStatusIcon status={status} />
      {showLabel ? (
        <span className="text-sm">{AGENT_FEEDBACK_STATUS_LABELS[status]}</span>
      ) : (
        <span className="sr-only">{AGENT_FEEDBACK_STATUS_LABELS[status]}</span>
      )}
    </span>
  );
}

export function AgentFeedbackKindBadge({ kind }: AgentFeedbackKindBadgeProps) {
  return (
    <span
      className={cn(
        AGENT_FEEDBACK_LABEL_PILL_CLASS,
        AGENT_FEEDBACK_KIND_PILL_CLASS[kind]
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          AGENT_FEEDBACK_KIND_DOT_CLASS[kind]
        )}
      />
      {AGENT_FEEDBACK_KIND_LABELS[kind]}
    </span>
  );
}

export function AgentFeedbackSentimentLabel({
  sentiment,
}: AgentFeedbackSentimentLabelProps) {
  if (!sentiment) {
    return <span className="text-muted-foreground text-xs">–</span>;
  }
  return (
    <span
      className={cn(
        AGENT_FEEDBACK_LABEL_PILL_CLASS,
        AGENT_FEEDBACK_SENTIMENT_PILL_CLASS[sentiment]
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          AGENT_FEEDBACK_SENTIMENT_DOT_CLASS[sentiment]
        )}
      />
      {AGENT_FEEDBACK_SENTIMENT_LABELS[sentiment]}
    </span>
  );
}
