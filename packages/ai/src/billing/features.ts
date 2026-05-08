export const FEATURES = {
  TEAM_MEMBERS: "team_members",
  AI_CREDITS: "ai_credits",
  WORKFLOWS: "workflows",
  INTEGRATIONS: "integrations",
  REFERENCES: "references",
  LOG_RETENTION_7_DAYS: "log_retention_7_days",
  LOG_RETENTION_14_DAYS: "log_retention_14_days",
  LOG_RETENTION_30_DAYS: "log_retention_30_days",
} as const;

export const PLANS = {
  FREE: "free",
  BASIC: "basic",
  BASIC_YEARLY: "basic_yearly",
  PRO: "pro",
  PRO_YEARLY: "pro_yearly",
} as const;

export const PAID_OR_LEGACY_PLAN_IDS: Set<string> = new Set([
  PLANS.FREE,
  PLANS.BASIC,
  PLANS.BASIC_YEARLY,
  PLANS.PRO,
  PLANS.PRO_YEARLY,
]);

export const ADDONS = {
  AI_CREDITS_TOPUP: "ai_credits_top_up",
} as const;

export const TOPUP_MIN_DOLLARS = 5;
export const TOPUP_MAX_DOLLARS = 500;

export const TOPUP_PRESETS = [5, 10, 25, 50] as const;

export type FeatureId = (typeof FEATURES)[keyof typeof FEATURES];
