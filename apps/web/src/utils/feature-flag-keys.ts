export const FEATURE_FLAG_COOKIE_PREFIX = "notra_ff_";

export const LANDING_PAGE_H1_EXPERIMENT_KEY = "landing-page-h1";
export const LANDING_PAGE_H1_TEAM_MARKETER_VARIANT = "team-marketer";

export function getFeatureFlagCookieName(key: string): string {
  return FEATURE_FLAG_COOKIE_PREFIX + key;
}
