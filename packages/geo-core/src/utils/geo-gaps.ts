import type { GeoContentBriefStatus } from "@notra/db/types/geo-writer";

export const REUSABLE_BRIEF_STATUSES = [
  "draft",
  "approved",
  "writing",
  "failed",
] as const satisfies readonly GeoContentBriefStatus[];

const OPEN_BRIEF_STATUSES = new Set<GeoContentBriefStatus>(
  REUSABLE_BRIEF_STATUSES
);

export function isMissingMajority(
  missingCount: number,
  total: number
): boolean {
  return missingCount * 2 >= total;
}

export function gapOpportunityScore(
  ownMentionRate: number,
  competitorCount: number,
  engineCoverage: number
): number {
  return (1 - ownMentionRate) * competitorCount * engineCoverage;
}

export function isReusableBriefStatus(status: GeoContentBriefStatus): boolean {
  return OPEN_BRIEF_STATUSES.has(status);
}

export function searchGapImpressions(
  keywords: Array<{ impressions: number }> | null | undefined
): number | null {
  if (!keywords || keywords.length === 0) {
    return null;
  }
  return keywords.reduce((sum, keyword) => sum + keyword.impressions, 0);
}
