import {
  CHART_MUTED_COLOR,
  CHART_OTHER_SLICE_LABEL,
  CHART_PRIMARY_COLOR,
  RIVAL_SWATCHES,
} from "@/constants/charts";
import { OWN_BRAND_ROW_ID } from "@/constants/geo";
import { competitorKey } from "@/lib/geo/domain";
import type { ChartColorPair } from "@/types/charts";
import type {
  GeoCompetitor,
  GeoCompetitorKind,
  GeoCompetitorRowEntry,
  GeoCompetitorSharePoint,
  GeoCompetitorTypeFilter,
} from "@/types/geo";
import { bestFuzzyScore, fuzzyMatches } from "@/utils/fuzzy";

const DOMAIN_LIKE_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

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

const FALLBACK_SLICE_COLOR = CHART_PRIMARY_COLOR.light;

export function isOwnBrandName(
  name: string,
  companyName?: string | null,
  aliases: readonly string[] = []
): boolean {
  if (!companyName) {
    return false;
  }
  const key = competitorKey(name);
  return key.length > 0 && ownBrandKeys(companyName, aliases).has(key);
}

export function competitorSliceColor(index: number): ChartColorPair {
  const hex =
    RIVAL_SWATCHES[index % RIVAL_SWATCHES.length] ?? FALLBACK_SLICE_COLOR;
  return { light: hex, dark: hex };
}

export function shareOfVoiceSliceColor(
  brand: string,
  index: number,
  competitors?: readonly GeoCompetitor[],
  ownBrand?: { companyName?: string | null; aliases?: readonly string[] }
): ChartColorPair {
  if (brand === CHART_OTHER_SLICE_LABEL) {
    return CHART_MUTED_COLOR;
  }
  if (isOwnBrandName(brand, ownBrand?.companyName, ownBrand?.aliases)) {
    return CHART_PRIMARY_COLOR;
  }
  const key = competitorKey(brand);
  const stored = competitors?.find(
    (competitor) => competitorKey(competitor.name) === key
  )?.color;
  if (stored) {
    return { light: stored, dark: stored };
  }
  return competitorSliceColor(index);
}

export function shareOfVoiceRivalIndex(
  rows: readonly { brand: string }[],
  brand: string,
  ownBrand?: { companyName?: string | null; aliases?: readonly string[] }
): number {
  let index = 0;
  for (const row of rows) {
    if (row.brand === brand) {
      return index;
    }
    if (
      row.brand !== CHART_OTHER_SLICE_LABEL &&
      !isOwnBrandName(row.brand, ownBrand?.companyName, ownBrand?.aliases)
    ) {
      index += 1;
    }
  }
  return index;
}

function ownBrandKeys(
  companyName: string,
  aliases: readonly string[]
): Set<string> {
  const keys = new Set<string>();
  for (const value of [companyName, ...aliases]) {
    const key = competitorKey(value);
    if (key.length > 0) {
      keys.add(key);
    }
  }
  return keys;
}

function isRivalSharePoint(
  point: GeoCompetitorSharePoint,
  ownKeys: ReadonlySet<string>
): boolean {
  const key = competitorKey(point.brand);
  return key.length > 0 && !ownKeys.has(key);
}

export function topRivalSharePoint(
  points: readonly GeoCompetitorSharePoint[],
  companyName: string,
  aliases: readonly string[] = []
): GeoCompetitorSharePoint | null {
  const ownKeys = ownBrandKeys(companyName, aliases);
  let leader: GeoCompetitorSharePoint | null = null;
  for (const point of points) {
    if (!isRivalSharePoint(point, ownKeys)) {
      continue;
    }
    if (!leader || point.mentions > leader.mentions) {
      leader = point;
    }
  }
  return leader;
}

export function rivalMentionShare(
  rival: GeoCompetitorSharePoint,
  points: readonly GeoCompetitorSharePoint[],
  companyName: string,
  aliases: readonly string[] = []
): number {
  const ownKeys = ownBrandKeys(companyName, aliases);
  let total = 0;
  for (const point of points) {
    if (isRivalSharePoint(point, ownKeys)) {
      total += point.mentions;
    }
  }
  if (total <= 0) {
    return 0;
  }
  return rival.mentions / total;
}

export function competitorCanonicalMap(
  competitors: readonly {
    name: string;
    synonyms?: readonly string[];
  }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const competitor of competitors) {
    const nameKey = competitorKey(competitor.name);
    if (nameKey.length === 0) {
      continue;
    }
    map.set(nameKey, competitor.name);
    for (const synonym of competitor.synonyms ?? []) {
      const key = competitorKey(synonym);
      if (key.length > 0 && !map.has(key)) {
        map.set(key, competitor.name);
      }
    }
  }
  return map;
}

/** Keep mention-check names that match a tracked competitor or synonym. */
export function matchTrackedCompetitorNames(
  mentioned: readonly string[],
  competitors: readonly {
    name: string;
    synonyms?: readonly string[];
  }[]
): string[] {
  const aliases = competitorCanonicalMap(competitors);
  const matched: string[] = [];
  const seen = new Set<string>();
  for (const name of mentioned) {
    const canonical = aliases.get(competitorKey(name));
    if (!canonical || seen.has(canonical)) {
      continue;
    }
    seen.add(canonical);
    matched.push(canonical);
  }
  return matched;
}

export function mergeCompetitorSharePoints(
  points: readonly GeoCompetitorSharePoint[],
  competitors: readonly GeoCompetitor[] | undefined
): GeoCompetitorSharePoint[] {
  const canonicalByKey = competitorCanonicalMap(competitors ?? []);

  const merged = new Map<string, GeoCompetitorSharePoint>();
  for (const point of points) {
    const rawKey = competitorKey(point.brand);
    const brand = canonicalByKey.get(rawKey) ?? point.brand;
    const key = competitorKey(brand);
    const existing = merged.get(key);
    merged.set(key, {
      brand: canonicalByKey.get(key) ?? existing?.brand ?? point.brand,
      mentions: (existing?.mentions ?? 0) + point.mentions,
    });
  }

  return [...merged.values()].sort((a, b) => b.mentions - a.mentions);
}

export function geoCompetitorDetailPath(
  organizationSlug: string,
  brand: string
): string {
  return `/${organizationSlug}/geo/competitors/${encodeURIComponent(brand)}`;
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
      color: CHART_PRIMARY_COLOR,
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
        : competitorSliceColor(index),
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
