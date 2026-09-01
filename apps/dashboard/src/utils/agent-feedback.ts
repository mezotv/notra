import { AGENT_FEEDBACK_STATUSES } from "@notra/db/constants/agent-feedback";
import type { AgentFeedbackStatus } from "@notra/db/types/agent-feedback";

import {
  AGENT_FEEDBACK_SNIPPET_TABS,
  AGENT_FEEDBACK_STATUS_FILTERS,
} from "@/constants/agent-feedback";
import type {
  AgentFeedbackSnippetKey,
  AgentFeedbackStatusFilter,
} from "@/types/agent-feedback";

export function isAgentFeedbackStatus(
  value: string
): value is AgentFeedbackStatus {
  return AGENT_FEEDBACK_STATUSES.some((status) => status === value);
}

export function isAgentFeedbackStatusFilter(
  value: string
): value is AgentFeedbackStatusFilter {
  return AGENT_FEEDBACK_STATUS_FILTERS.some((filter) => filter.value === value);
}

export function isAgentFeedbackSnippetKey(
  value: string
): value is AgentFeedbackSnippetKey {
  return AGENT_FEEDBACK_SNIPPET_TABS.some((tab) => tab.value === value);
}
