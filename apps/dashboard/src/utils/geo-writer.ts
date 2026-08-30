import { competitorKey } from "@notra/geo-core/geo/domain";
import type { GeoCompetitor } from "@notra/geo-core/types/geo";

import {
  GEO_WRITE_COMPETITOR_DETAIL,
  GEO_WRITE_FORMAT_DEFAULT_REASON,
  GEO_WRITE_FORMAT_RULES,
} from "@/constants/geo-writer";
import type {
  WriteDialogBaseline,
  WriteFormatRecommendation,
} from "@/types/components/geo-writer";

export function recommendedContentSubtype(
  prompt: string
): WriteFormatRecommendation {
  const trimmed = prompt.trim();
  for (const rule of GEO_WRITE_FORMAT_RULES) {
    if (rule.pattern.test(trimmed)) {
      return { id: rule.id, reason: rule.reason };
    }
  }
  return { id: "guide", reason: GEO_WRITE_FORMAT_DEFAULT_REASON };
}

export function writerBaselineLabel(
  baseline: WriteDialogBaseline | null | undefined
): string | null {
  if (!baseline || baseline.totalEngines === 0) {
    return null;
  }
  return `Current: ${baseline.mentionedEngines}/${baseline.totalEngines} engines · target: ${baseline.totalEngines}/${baseline.totalEngines}`;
}

export function writerCompetitorDetail(
  competitor: GeoCompetitor,
  mentionedCompetitors: readonly string[]
): string {
  const keys = new Set(
    [competitor.name, ...(competitor.synonyms ?? [])].map(competitorKey)
  );
  const mentioned = mentionedCompetitors.some((name) =>
    keys.has(competitorKey(name))
  );
  const detail = mentioned
    ? GEO_WRITE_COMPETITOR_DETAIL.mentioned
    : GEO_WRITE_COMPETITOR_DETAIL.tracked;
  return competitor.domain ? `${detail} · ${competitor.domain}` : detail;
}
