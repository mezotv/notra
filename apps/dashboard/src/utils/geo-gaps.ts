import type { GeoContentBriefStatus } from "@notra/db/types/geo-writer";
import {
  GEO_GAPS_ENGINE_FILTER_ALL,
  GEO_GAPS_METER_STEPS,
  GEO_GAPS_WRITE_LABELS,
} from "@/constants/geo";
import type {
  GeoGapsEmptyKind,
  GeoGapsMeterTone,
  GeoGapsTab,
} from "@/types/components/geo-gaps";
import type {
  GeoGapBriefRef,
  GeoGapWriteAction,
  GeoPromptGapRow,
  GeoSearchGapRow,
} from "@/types/geo";
import { bestFuzzyScore, fuzzyMatches } from "@/utils/fuzzy";
import { engineFamilyLabel, engineFamilyOf } from "@/utils/geo-charts";

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

/** Map 0–1 intensity onto a 1–5 inspo-style meter (empty when intensity is 0). */
export function gapMeterLevel(
  intensity: number,
  steps = GEO_GAPS_METER_STEPS
): number {
  if (intensity <= 0 || steps <= 0) {
    return 0;
  }
  return Math.max(1, Math.min(steps, Math.round(intensity * steps)));
}

export function gapMeterTone(level: number): GeoGapsMeterTone {
  if (level <= 0) {
    return "empty";
  }
  if (level <= 2) {
    return "low";
  }
  if (level === 3) {
    return "mid";
  }
  return "high";
}

/** Deduplicate scan engines to brand families (openai, claude, …). */
export function gapMissingEngineFamilies(engines: readonly string[]): string[] {
  const families: string[] = [];
  const seen = new Set<string>();
  for (const engine of engines) {
    const family = engineFamilyOf(engine);
    if (seen.has(family)) {
      continue;
    }
    seen.add(family);
    families.push(family);
  }
  return families;
}

export function gapWriteAction(
  brief: GeoGapBriefRef | null
): GeoGapWriteAction {
  if (!brief) {
    return "write";
  }
  if (brief.status === "completed" && brief.postId) {
    return "open";
  }
  if (brief.status === "writing" || brief.status === "approved") {
    return "writing";
  }
  if (brief.status === "draft" && brief.postId) {
    return "review";
  }
  if (brief.status === "failed" && brief.postId) {
    return "review";
  }
  return "write";
}

export function gapWriteLabel(action: GeoGapWriteAction): string {
  return GEO_GAPS_WRITE_LABELS[action];
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

export function geoGapsEmptyKind({
  tab,
  hasScanData,
  isScanning,
  hasSourceRows = false,
  hasMatches = true,
}: {
  tab: GeoGapsTab;
  hasScanData: boolean;
  isScanning: boolean;
  hasSourceRows?: boolean;
  hasMatches?: boolean;
}): GeoGapsEmptyKind {
  if (hasSourceRows && !hasMatches) {
    return "no-matches";
  }
  if (tab === "search") {
    return "no-search-gaps";
  }
  if (isScanning && !hasScanData) {
    return "scanning";
  }
  if (!hasScanData) {
    return "no-scan";
  }
  return "no-prompt-gaps";
}

function gapSearchValues(row: {
  prompt: string;
  title: string | null;
  brief: GeoGapBriefRef | null;
}): string[] {
  return [row.prompt, row.title ?? "", row.brief?.workingTitle ?? ""];
}

function filterGapsByQuery<
  T extends {
    prompt: string;
    title: string | null;
    brief: GeoGapBriefRef | null;
  },
>(rows: readonly T[], query: string): T[] {
  const trimmed = query.trim();
  const matched = rows.filter((row) =>
    fuzzyMatches(gapSearchValues(row), trimmed)
  );
  if (trimmed.length === 0) {
    return matched;
  }
  return matched
    .map((row) => ({
      row,
      score: bestFuzzyScore(gapSearchValues(row), trimmed),
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.row);
}

export function filterPromptGaps(
  rows: readonly GeoPromptGapRow[],
  query: string,
  engineFamily: string
): GeoPromptGapRow[] {
  const byEngine =
    engineFamily === GEO_GAPS_ENGINE_FILTER_ALL
      ? rows
      : rows.filter((row) =>
          gapMissingEngineFamilies(row.engines).includes(engineFamily)
        );
  return filterGapsByQuery(byEngine, query);
}

export function filterSearchGaps(
  rows: readonly GeoSearchGapRow[],
  query: string
): GeoSearchGapRow[] {
  return filterGapsByQuery(rows, query);
}

export function uniqueGapEngineFamilies(
  rows: readonly GeoPromptGapRow[]
): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const family of gapMissingEngineFamilies(row.engines)) {
      seen.add(family);
    }
  }
  return [...seen].sort((left, right) =>
    engineFamilyLabel(left).localeCompare(engineFamilyLabel(right))
  );
}
