import type { GscQueryRow } from "@notra/ai/types/google-search-console";

import {
  GSC_SYNC_MAX_KEYWORDS_FOR_MODEL,
  GSC_SYNC_MIN_IMPRESSIONS,
} from "@/constants/google-search-console";
import type { GeoSuggestionKeyword } from "@/types/geo";

const MIN_BRAND_TERM_LENGTH = 3;

export function normalizeSuggestionKey(value: string): string {
  return value.trim().toLowerCase();
}

function isBrandedQuery(query: string, brandTerms: string[]): boolean {
  const normalized = ` ${normalizeSuggestionKey(query)} `;
  // Space-delimited so a short alias like "hub" does not drop "github".
  return brandTerms.some((term) => normalized.includes(` ${term} `));
}

export function buildBrandTerms(
  settings: { companyName: string; aliases: string[] } | null | undefined
): string[] {
  if (!settings) {
    return [];
  }
  return [settings.companyName, ...settings.aliases].flatMap((value) => {
    const term = normalizeSuggestionKey(value);
    return term.length >= MIN_BRAND_TERM_LENGTH ? [term] : [];
  });
}

export function selectKeywordsForModel(
  rows: GscQueryRow[],
  brandTerms: string[]
): GscQueryRow[] {
  return rows
    .filter(
      (row) =>
        row.impressions >= GSC_SYNC_MIN_IMPRESSIONS &&
        !isBrandedQuery(row.query, brandTerms)
    )
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
    .slice(0, GSC_SYNC_MAX_KEYWORDS_FOR_MODEL);
}

export function resolveSourceKeywords(
  claimed: string[],
  keywordByQuery: Map<string, GscQueryRow>
): GeoSuggestionKeyword[] {
  const sourceKeywords: GeoSuggestionKeyword[] = [];
  const used = new Set<string>();
  for (const keyword of claimed) {
    const key = normalizeSuggestionKey(keyword);
    const match = keywordByQuery.get(key);
    if (match && !used.has(key)) {
      used.add(key);
      sourceKeywords.push({
        query: match.query,
        clicks: match.clicks,
        impressions: match.impressions,
        position: Number(match.position.toFixed(1)),
      });
    }
  }
  return sourceKeywords;
}
