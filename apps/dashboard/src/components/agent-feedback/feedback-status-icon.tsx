import { cn } from "@notra/ui/lib/utils";

import { AGENT_FEEDBACK_STATUS_ICON_CLASS } from "@/constants/agent-feedback";
import type { AgentFeedbackStatusIconProps } from "@/types/agent-feedback";

export function AgentFeedbackStatusIcon({
  status,
  className,
}: AgentFeedbackStatusIconProps) {
  const iconClass = cn(
    "size-3.5 shrink-0",
    AGENT_FEEDBACK_STATUS_ICON_CLASS[status],
    className
  );

  if (status === "new") {
    return (
      <svg
        aria-hidden="true"
        className={iconClass}
        fill="none"
        viewBox="0 0 16 16"
      >
        <circle
          cx="8"
          cy="8"
          r="5.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (status === "triaged") {
    return (
      <svg
        aria-hidden="true"
        className={iconClass}
        fill="none"
        viewBox="0 0 16 16"
      >
        <circle
          cx="8"
          cy="8"
          r="5.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M8 2.75a5.25 5.25 0 0 1 0 10.5Z" fill="currentColor" />
      </svg>
    );
  }

  if (status === "resolved") {
    return (
      <svg
        aria-hidden="true"
        className={iconClass}
        fill="none"
        viewBox="0 0 16 16"
      >
        <circle cx="8" cy="8" fill="currentColor" r="6.25" />
        <path
          d="M5.25 8.15 7.1 10l3.65-3.8"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={iconClass}
      fill="none"
      viewBox="0 0 16 16"
    >
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.2 5.2 10.8 10.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
