import { COMPETITOR_SWATCHES } from "@/constants/charts";
import { OWN_BRAND_ROW_ID } from "@/constants/geo";
import type { ChartColorPair } from "@/types/charts";
import type {
  GeoCompetitor,
  GeoCompetitorKind,
  GeoCompetitorRowEntry,
  GeoCompetitorTypeFilter,
} from "@/types/geo";
import { bestFuzzyScore, fuzzyMatches } from "@/utils/fuzzy";

const DOMAIN_LIKE_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export function parseCompetitorSynonyms(value: string): string[] {
  const seen = new Set<string>();
  const synonyms: string[] = [];
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    const key = trimmed.toLowerCase();
    if (trimmed.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    synonyms.push(trimmed);
  }
  return synonyms;
}

export function formatCompetitorKind(kind: GeoCompetitorKind): string {
  return kind === "direct" ? "Direct" : "Indirect";
}

export function findOwnBrandDomain(aliases: readonly string[]): string | null {
  for (const alias of aliases) {
    const candidate = alias.trim().toLowerCase();
    if (DOMAIN_LIKE_REGEX.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

const FALLBACK_SLICE_COLOR = "#7C5CF0";

export function competitorSliceColor(index: number): ChartColorPair {
  const hex =
    COMPETITOR_SWATCHES[index % COMPETITOR_SWATCHES.length] ??
    FALLBACK_SLICE_COLOR;
  return { light: hex, dark: hex };
}

export function buildCompetitorRows(
  competitors: readonly GeoCompetitor[],
  companyName: string,
  ownDomain: string | null,
  search: string,
  typeFilter: GeoCompetitorTypeFilter
): GeoCompetitorRowEntry[] {
  const query = search.trim().toLowerCase();
  const rows: GeoCompetitorRowEntry[] = [
    {
      id: OWN_BRAND_ROW_ID,
      name: companyName,
      domain: ownDomain,
      synonyms: [],
      kind: "direct",
      isOwnBrand: true,
      color: competitorSliceColor(0),
    },
  ];

  competitors.forEach((competitor, index) => {
    rows.push({
      id: competitor.id,
      name: competitor.name,
      domain: competitor.domain,
      synonyms: competitor.synonyms,
      kind: competitor.kind,
      isOwnBrand: false,
      color: competitor.color
        ? { light: competitor.color, dark: competitor.color }
        : competitorSliceColor(index + 1),
    });
  });

  const filtered = rows.filter((row) => {
    if (typeFilter !== "all" && !row.isOwnBrand && row.kind !== typeFilter) {
      return false;
    }
    return fuzzyMatches([row.name, row.domain ?? "", ...row.synonyms], query);
  });

  if (query.length === 0) {
    return filtered;
  }

  return filtered
    .map((row) => ({
      row,
      score: bestFuzzyScore(
        [row.name, row.domain ?? "", ...row.synonyms],
        query
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.row);
}
