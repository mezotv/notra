import type {
  AGENT_FEEDBACK_KINDS,
  AGENT_FEEDBACK_SENTIMENTS,
  AGENT_FEEDBACK_SOURCES,
  AGENT_FEEDBACK_STATUSES,
} from "../constants/agent-feedback";

export type AgentFeedbackKind = (typeof AGENT_FEEDBACK_KINDS)[number];
export type AgentFeedbackSentiment = (typeof AGENT_FEEDBACK_SENTIMENTS)[number];
export type AgentFeedbackStatus = (typeof AGENT_FEEDBACK_STATUSES)[number];
export type AgentFeedbackSource = (typeof AGENT_FEEDBACK_SOURCES)[number];
export type AgentFeedbackMetadata = Record<string, unknown>;
