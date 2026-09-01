import type { GeoTrafficPage } from "@notra/geo-core/types/geo";
import { formatGeoSource } from "@notra/geo-core/utils/ai-traffic";

import type { GeoTrafficPageGroup, GeoTrafficPageSource } from "@/types/geo";
import { laterTrafficTimestamp } from "@/utils/ai-traffic-groups";

function pageSourceKey(page: GeoTrafficPage): string {
  return `${page.visitorType}:${formatGeoSource(page.source).toLowerCase()}`;
}

function byVisitsDesc(
  left: GeoTrafficPageSource,
  right: GeoTrafficPageSource
): number {
  return right.visits - left.visits;
}

export function groupTrafficPages(
  pages: readonly GeoTrafficPage[]
): GeoTrafficPageGroup[] {
  const groups = new Map<string, GeoTrafficPageGroup>();
  const sourcesByGroup = new Map<string, Map<string, GeoTrafficPageSource>>();

  for (const page of pages) {
    const existing = groups.get(page.path);
    const group: GeoTrafficPageGroup = existing ?? {
      path: page.path,
      visits: 0,
      lastSeenAt: page.lastSeenAt,
      sources: [],
    };
    if (existing === undefined) {
      groups.set(page.path, group);
      sourcesByGroup.set(page.path, new Map());
    }

    group.visits += page.visits;
    if (page.previousVisits !== undefined) {
      group.previousVisits = (group.previousVisits ?? 0) + page.previousVisits;
    }
    group.lastSeenAt = laterTrafficTimestamp(group.lastSeenAt, page.lastSeenAt);

    const sources = sourcesByGroup.get(page.path);
    const key = pageSourceKey(page);
    const source = sources?.get(key);
    if (source === undefined) {
      sources?.set(key, {
        source: page.source,
        visitorType: page.visitorType,
        visits: page.visits,
        lastSeenAt: page.lastSeenAt,
      });
      continue;
    }
    source.visits += page.visits;
    source.lastSeenAt = laterTrafficTimestamp(
      source.lastSeenAt,
      page.lastSeenAt
    );
  }

  const result = [...groups.values()];
  for (const group of result) {
    group.sources = Array.from(
      sourcesByGroup.get(group.path)?.values() ?? []
    ).sort(byVisitsDesc);
  }
  return result;
}

export function trafficPageSourcesLabel(group: GeoTrafficPageGroup): string {
  const count = group.sources.length;
  return `${count} ${count === 1 ? "source" : "sources"}`;
}
