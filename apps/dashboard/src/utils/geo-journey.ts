import { parseClickHouseDateTime } from "@notra/analytics/utils/datetime";

import {
  GEO_JOURNEY_BLOG_PREFIXES,
  GEO_JOURNEY_DEEP_CRAWL_PAGES,
  GEO_JOURNEY_DOCS_PREFIXES,
  GEO_JOURNEY_HOME_PATHS,
  GEO_JOURNEY_OVERVIEW_PATHS,
  GEO_JOURNEY_OVERVIEW_SOURCES,
  GEO_JOURNEY_PATH_KIND_LABELS,
  GEO_JOURNEY_PATH_KINDS,
  GEO_JOURNEY_PATH_LABEL_MAX,
  GEO_JOURNEY_SEARCH_PREFIXES,
} from "@/constants/geo";
import type {
  GeoJourney,
  GeoJourneyEvent,
  GeoJourneyKindCount,
  GeoJourneyOverview,
  GeoJourneyPathKind,
  GeoJourneyPathNode,
  GeoJourneyPathRow,
  GeoJourneySourceRow,
  GeoJourneyTrail,
} from "@/types/geo";

const WWW_PREFIX = /^www\./;
const SEARCH_QUERY = /[?&](?:q|query|s|search)=/i;
const TRAIL_GAP_PATH = "…";

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

export function formatGeoJourneyClock(value: string): string {
  const date = parseClickHouseDateTime(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return clockFormatter.format(date);
}

export function formatGeoRefererSource(referer: string): string {
  const trimmed = referer.trim();
  if (!trimmed) {
    return "";
  }
  try {
    return new URL(trimmed).hostname.replace(WWW_PREFIX, "");
  } catch {
    return trimmed;
  }
}

export function hasGeoJourneyReferers(
  events: readonly GeoJourneyEvent[]
): boolean {
  return events.some((event) => formatGeoRefererSource(event.referer) !== "");
}

export function normalizeGeoJourneyPath(path: string): string {
  const withoutQuery = path.trim().split("?")[0] ?? "";
  if (withoutQuery === "" || withoutQuery === "/") {
    return "/";
  }
  return withoutQuery.replace(/\/+$/, "") || "/";
}

function startsWithPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function classifyGeoJourneyPath(path: string): GeoJourneyPathKind {
  const normalized = normalizeGeoJourneyPath(path);
  if (
    SEARCH_QUERY.test(path) ||
    startsWithPrefix(normalized, GEO_JOURNEY_SEARCH_PREFIXES)
  ) {
    return "search";
  }
  if (GEO_JOURNEY_HOME_PATHS.has(normalized)) {
    return "home";
  }
  if (startsWithPrefix(normalized, GEO_JOURNEY_DOCS_PREFIXES)) {
    return "docs";
  }
  if (startsWithPrefix(normalized, GEO_JOURNEY_BLOG_PREFIXES)) {
    return "blog";
  }
  return "page";
}

export function formatGeoJourneyPathLabel(path: string): string {
  if (path === TRAIL_GAP_PATH) {
    return TRAIL_GAP_PATH;
  }
  const kind = classifyGeoJourneyPath(path);
  if (kind === "home") {
    return "home";
  }
  if (kind === "search") {
    const normalized = normalizeGeoJourneyPath(path);
    if (startsWithPrefix(normalized, GEO_JOURNEY_SEARCH_PREFIXES)) {
      return "search";
    }
  }
  const normalized = normalizeGeoJourneyPath(path);
  if (normalized.length <= GEO_JOURNEY_PATH_LABEL_MAX) {
    return normalized;
  }
  const last = normalized.split("/").filter(Boolean).at(-1);
  return last ? `…/${last}` : normalized.slice(0, GEO_JOURNEY_PATH_LABEL_MAX);
}

export function toGeoJourneyPathNode(path: string): GeoJourneyPathNode {
  return {
    path,
    label: formatGeoJourneyPathLabel(path),
    kind: classifyGeoJourneyPath(path),
  };
}

export function isGeoJourneyTrailGap(path: string): boolean {
  return path === TRAIL_GAP_PATH;
}

function collapseConsecutivePaths(paths: readonly string[]): string[] {
  const collapsed: string[] = [];
  for (const path of paths) {
    const normalized = normalizeGeoJourneyPath(path);
    if (collapsed.at(-1) === normalized) {
      continue;
    }
    collapsed.push(normalized);
  }
  return collapsed;
}

export function compactJourneyPaths(
  paths: readonly string[],
  limit: number
): GeoJourneyTrail {
  const collapsed = collapseConsecutivePaths(paths);
  if (collapsed.length <= limit) {
    return {
      nodes: collapsed.map(toGeoJourneyPathNode),
      omitted: 0,
    };
  }
  const head = Math.ceil(limit / 2);
  const tail = Math.max(limit - head, 1);
  const omitted = collapsed.length - head - tail;
  return {
    nodes: [
      ...collapsed.slice(0, head).map(toGeoJourneyPathNode),
      {
        path: TRAIL_GAP_PATH,
        label: TRAIL_GAP_PATH,
        kind: "page",
      },
      ...collapsed.slice(-tail).map(toGeoJourneyPathNode),
    ],
    omitted,
  };
}

function medianValue(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
  }
  return sorted[middle] ?? 0;
}

function shareOf(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return count / total;
}

export function buildJourneyOverview(
  journeys: readonly GeoJourney[]
): GeoJourneyOverview {
  const sourceCounts = new Map<string, GeoJourneySourceRow>();
  const pathCounts = new Map<string, GeoJourneyPathRow>();

  for (const journey of journeys) {
    const sourceKey = `${journey.source}\0${journey.visitorType}`;
    const sourceRow = sourceCounts.get(sourceKey);
    if (sourceRow) {
      sourceRow.journeys += 1;
    } else {
      sourceCounts.set(sourceKey, {
        source: journey.source,
        visitorType: journey.visitorType,
        journeys: 1,
      });
    }

    for (const path of journey.samplePaths) {
      const normalized = normalizeGeoJourneyPath(path);
      const pathRow = pathCounts.get(normalized);
      if (pathRow) {
        pathRow.journeys += 1;
        continue;
      }
      pathCounts.set(normalized, {
        ...toGeoJourneyPathNode(normalized),
        journeys: 1,
      });
    }
  }

  const sources = [...sourceCounts.values()].sort((left, right) => {
    if (right.journeys !== left.journeys) {
      return right.journeys - left.journeys;
    }
    return left.source.localeCompare(right.source);
  });
  const paths = [...pathCounts.values()].sort((left, right) => {
    if (right.journeys !== left.journeys) {
      return right.journeys - left.journeys;
    }
    return left.path.localeCompare(right.path);
  });
  const kindTotals = new Map<GeoJourneyPathKind, number>(
    GEO_JOURNEY_PATH_KINDS.map((kind) => [kind, 0])
  );
  for (const path of paths) {
    kindTotals.set(path.kind, (kindTotals.get(path.kind) ?? 0) + 1);
  }
  const kindCounts: GeoJourneyKindCount[] = GEO_JOURNEY_PATH_KINDS.flatMap(
    (kind) => {
      const count = kindTotals.get(kind) ?? 0;
      return count > 0 ? [{ kind, paths: count }] : [];
    }
  );

  return {
    total: journeys.length,
    sources: sources.slice(0, GEO_JOURNEY_OVERVIEW_SOURCES),
    uniqueSources: sources.length,
    medianPages: medianValue(journeys.map((journey) => journey.pages)),
    singleFetchShare: shareOf(
      journeys.filter((journey) => journey.pages <= 1).length,
      journeys.length
    ),
    deepShare: shareOf(
      journeys.filter(
        (journey) => journey.pages >= GEO_JOURNEY_DEEP_CRAWL_PAGES
      ).length,
      journeys.length
    ),
    paths: paths.slice(0, GEO_JOURNEY_OVERVIEW_PATHS),
    uniquePaths: paths.length,
    kindCounts,
  };
}

export function formatJourneyKindSummary(
  kindCounts: readonly GeoJourneyKindCount[]
): string {
  return kindCounts
    .map(
      (entry) =>
        `${entry.paths} ${GEO_JOURNEY_PATH_KIND_LABELS[entry.kind].toLowerCase()}`
    )
    .join(" · ");
}

export function buildJourneyDepthSummary(
  journeys: readonly GeoJourney[]
): string {
  if (journeys.length === 0) {
    return "";
  }
  const overview = buildJourneyOverview(journeys);
  const share = (value: number) => `${Math.round(value * 100)}%`;
  return `median ${overview.medianPages} ${overview.medianPages === 1 ? "page" : "pages"} · ${share(overview.deepShare)} crawl ${GEO_JOURNEY_DEEP_CRAWL_PAGES}+ · ${share(overview.singleFetchShare)} single-fetch`;
}
