import { createSerializer, parseAsString } from "nuqs";

export const LANDING_PAGE_H1_EXPERIMENT_KEY = "landing-page-h1";
export const LANDING_PAGE_H1_TEAM_MARKETER_VARIANT = "team-marketer";

const LANDING_PAGE_H1_CONTROL_COPY = "Ship more. Write less. Reach more.";
export const LANDING_PAGE_H1_TEAM_MARKETER_COPY =
  "Every feature, marketed automatically.";

export const DATABUDDY_SIGNUP_STARTED_EVENT = "signup_started";

const signupAttributionSearchParams = {
  landingPageH1Copy: parseAsString,
  landingPageH1Variant: parseAsString,
  source: parseAsString,
};

const signupAttributionUrlKeys = {
  landingPageH1Copy: "db_landing_page_h1_copy",
  landingPageH1Variant: "db_landing_page_h1_variant",
  source: "db_source",
} as const;

export const serializeSignupAttribution = createSerializer(
  signupAttributionSearchParams,
  {
    urlKeys: signupAttributionUrlKeys,
  }
);

export function normalizeLandingPageH1Variant(variant?: string): string {
  return variant === LANDING_PAGE_H1_TEAM_MARKETER_VARIANT
    ? LANDING_PAGE_H1_TEAM_MARKETER_VARIANT
    : "control";
}

export function getLandingPageH1Copy(variant?: string): string {
  return normalizeLandingPageH1Variant(variant) ===
    LANDING_PAGE_H1_TEAM_MARKETER_VARIANT
    ? LANDING_PAGE_H1_TEAM_MARKETER_COPY
    : LANDING_PAGE_H1_CONTROL_COPY;
}
