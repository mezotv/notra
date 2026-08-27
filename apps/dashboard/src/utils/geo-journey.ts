import { parseClickHouseDateTime } from "@notra/analytics/utils/datetime";

import { GEO_JOURNEY_DEEP_CRAWL_PAGES } from "@/constants/geo";
import type { GeoJourney, GeoJourneyEvent } from "@/types/geo";

const WWW_PREFIX = /^www\./;

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

export function buildJourneyDepthSummary(
  journeys: readonly GeoJourney[]
): string {
  if (journeys.length === 0) {
    return "";
  }
  const pages = journeys
    .map((journey) => journey.pages)
    .sort((left, right) => left - right);
  const middle = Math.floor(pages.length / 2);
  const median =
    pages.length % 2 === 0
      ? Math.round(((pages[middle - 1] ?? 0) + (pages[middle] ?? 0)) / 2)
      : (pages[middle] ?? 0);
  const deep = journeys.filter(
    (journey) => journey.pages >= GEO_JOURNEY_DEEP_CRAWL_PAGES
  ).length;
  const single = journeys.filter((journey) => journey.pages <= 1).length;
  const share = (count: number) =>
    `${Math.round((count / journeys.length) * 100)}%`;
  return `median ${median} ${median === 1 ? "page" : "pages"} · ${share(deep)} crawl ${GEO_JOURNEY_DEEP_CRAWL_PAGES}+ · ${share(single)} single-fetch`;
}
