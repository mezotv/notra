import { POSTHOG_EVENTS } from "@notra/posthog/events";

export const WORKFLOW_ANALYTICS_NAMES = {
  BRAND_ANALYSIS: "brand-analysis",
  BRAND_GUIDELINES: "brand-guidelines",
  CHAT: "chat",
  ONBOARDING_AGENT: "onboarding-agent",
  IRIS_CONTROLLER: "iris-controller",
  SCHEDULE_CONTENT: "schedule-content",
  EVENT_CONTENT: "event-content",
  SOCIAL_ANALYTICS_SYNC: "social-analytics-sync",
  GEO_SCAN: "geo-scan",
  GEO_WRITER: "geo-writer",
  AGENT_READINESS: "agent-readiness",
  GSC_SYNC: "gsc-sync",
  ON_DEMAND_CONTENT: "on-demand-content",
  CONTENT_EMAIL_DIGEST: "content-email-digest",
} as const;

export const WORKFLOW_TRIGGERS = {
  MANUAL: "manual",
  SCHEDULE: "schedule",
  EVENT: "event",
  API: "api",
  DASHBOARD: "dashboard",
} as const;

export const WORKFLOW_OUTCOMES = {
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const WORKFLOW_UNEXPECTED_FAILURE_REASON = "unexpected_error";

export const CONTENT_OUTCOME_EVENTS = {
  created: POSTHOG_EVENTS.CONTENT_GENERATION_COMPLETED,
  failed: POSTHOG_EVENTS.CONTENT_GENERATION_FAILED,
  skipped: POSTHOG_EVENTS.CONTENT_GENERATION_SKIPPED,
} as const;

export const BRAND_ANALYSIS_PHASES_BY_STEP: Partial<Record<number, string>> = {
  1: "scraping",
  2: "extracting",
  3: "saving",
};

export const BRAND_ANALYSIS_UNEXPECTED_PHASE = "unexpected";
