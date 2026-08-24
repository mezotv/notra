import { LEGACY_PLANS, PLANS } from "@notra/ai/billing/features";

export const BILLING_SECTION_VALUES = ["billing", "usage"] as const;

export const BILLING_PRICE_REGEX = /^\d+([.,]\d+)?$/;

export const ANNUAL_PLAN_SUFFIXES = ["_annual", "_yearly"] as const;

export const ANNUAL_PLAN_NAME_SUFFIX = /\s*\(annual\)\s*$/i;

export const FEATURED_PLAN_TIER: string = PLANS.GROWTH;

export const LEGACY_PLAN_TIERS: Record<string, string> = {
  [LEGACY_PLANS.BASIC]: PLANS.STARTER,
  [LEGACY_PLANS.BASIC_YEARLY]: PLANS.STARTER,
  [LEGACY_PLANS.PRO]: PLANS.GROWTH,
  [LEGACY_PLANS.PRO_YEARLY]: PLANS.GROWTH,
};

export const PLAN_TIER_DESCRIPTIONS: Record<string, string> = {
  [PLANS.STARTER]: "For founders shipping their first content engine.",
  [PLANS.GROWTH]: "For teams publishing across channels every week.",
  [PLANS.SCALE]: "For content teams running multiple brands at volume.",
};

export const BILLING_SCENARIO_TEXT: Record<string, string> = {
  scheduled: "Plan Scheduled",
  active: "Current Plan",
  renew: "Renew",
  upgrade: "Upgrade",
  new: "Get Started",
  downgrade: "Downgrade",
  cancel: "Cancel Plan",
};

export const INVOICE_PRODUCT_NAME_FALLBACKS: Record<string, string> = {
  [PLANS.FREE]: "Free",
  [LEGACY_PLANS.BASIC]: "Basic",
  [LEGACY_PLANS.BASIC_YEARLY]: "Basic",
  [LEGACY_PLANS.PRO]: "Pro",
  [LEGACY_PLANS.PRO_YEARLY]: "Pro",
  ai_credits_top_up: "AI Credits Top-up",
};

export const INVOICE_TABLE_COLUMN_COUNT = 4;

export const GEO_PLAN_REQUIRED_MESSAGE =
  "GEO requires a Starter, Growth, or Scale plan";
