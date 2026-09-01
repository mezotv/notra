import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@notra/ui/lib/utils";

import { AgentFeedbackStatusIcon } from "@/components/agent-feedback/feedback-status-icon";
import {
  AGENT_FEEDBACK_KIND_ICONS,
  AGENT_FEEDBACK_KIND_LABELS,
  AGENT_FEEDBACK_KIND_PILL_CLASS,
  AGENT_FEEDBACK_LABEL_PILL_CLASS,
  AGENT_FEEDBACK_SENTIMENT_ICONS,
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
      <HugeiconsIcon
        aria-hidden
        className="size-3.5 shrink-0"
        icon={AGENT_FEEDBACK_KIND_ICONS[kind]}
        strokeWidth={2}
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
      <HugeiconsIcon
        aria-hidden
        className="size-3.5 shrink-0"
        icon={AGENT_FEEDBACK_SENTIMENT_ICONS[sentiment]}
        strokeWidth={2}
      />
      {AGENT_FEEDBACK_SENTIMENT_LABELS[sentiment]}
    </span>
  );
}
