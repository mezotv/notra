import { parseClickHouseDateTime } from "@notra/analytics/utils/datetime";

import {
  GEO_TRAFFIC_GROUPS_BY_ENGINE,
  GEO_TRAFFIC_OTHER_GROUP,
} from "@/constants/geo";
import type {
  GeoTrafficPoint,
  GeoTrafficPurposeTotal,
  GeoTrafficSource,
  GeoTrafficSourceGroup,
  GeoTrafficSourceGroupDefinition,
  GeoVisitorType,
} from "@/types/geo";
import { formatGeoSource, trafficDayKey } from "@/utils/ai-traffic";
import { resolveEngineIconKey } from "@/utils/geo-engine-icon";

export function trafficGroupKey(
  visitorType: GeoVisitorType,
  groupKey: string
): string {
  return `${visitorType}:${groupKey}`;
}

export function resolveTrafficSourceGroup(
  source: string,
  visitorType: GeoVisitorType
): GeoTrafficSourceGroupDefinition {
  const engine = resolveEngineIconKey(source);
  const group = engine ? GEO_TRAFFIC_GROUPS_BY_ENGINE[engine] : undefined;
  if (group === undefined) {
    return GEO_TRAFFIC_OTHER_GROUP;
  }
  if (visitorType !== "crawler") {
    return {
      key: source,
      label: formatGeoSource(source, visitorType),
      icon: source,
    };
  }
  return group;
}

function laterTimestamp(left: string, right: string): string {
  const leftTime = parseClickHouseDateTime(left).getTime();
  const rightTime = parseClickHouseDateTime(right).getTime();
  if (Number.isNaN(leftTime)) {
    return right;
  }
  if (Number.isNaN(rightTime)) {
    return left;
  }
  return rightTime > leftTime ? right : left;
}

function byVisitsDesc(left: GeoTrafficSource, right: GeoTrafficSource): number {
  return right.visits - left.visits;
}

export function groupTrafficSources(
  sources: readonly GeoTrafficSource[]
): GeoTrafficSourceGroup[] {
  const groups = new Map<string, GeoTrafficSourceGroup>();

  for (const source of sources) {
    const definition = resolveTrafficSourceGroup(
      source.source,
      source.visitorType
    );
    const key = trafficGroupKey(source.visitorType, definition.key);
    const existing = groups.get(key);
    if (existing === undefined) {
      groups.set(key, {
        ...definition,
        visitorType: source.visitorType,
        visits: source.visits,
        markdownVisits: source.markdownVisits,
        paths: source.paths,
        lastSeenAt: source.lastSeenAt,
        categories: source.category ? [source.category] : [],
        members: [source],
      });
      continue;
    }
    existing.visits += source.visits;
    existing.markdownVisits += source.markdownVisits;
    existing.paths = Math.max(existing.paths, source.paths);
    existing.lastSeenAt = laterTimestamp(
      existing.lastSeenAt,
      source.lastSeenAt
    );
    existing.members.push(source);
  }

  const result = [...groups.values()];
  for (const group of result) {
    group.members.sort(byVisitsDesc);
    const categories = new Set<string>();
    for (const member of group.members) {
      if (member.category.length > 0) {
        categories.add(member.category);
      }
    }
    group.categories = [...categories];
  }
  return result;
}

export function buildTrafficGroupSeries(
  points: readonly GeoTrafficPoint[],
  group: GeoTrafficSourceGroup,
  days: readonly string[]
): number[] {
  const memberSources = new Set(group.members.map((member) => member.source));
  const byDay = new Map<string, number>();
  for (const point of points) {
    if (
      point.visitorType !== group.visitorType ||
      !memberSources.has(point.source)
    ) {
      continue;
    }
    const day = trafficDayKey(point.day);
    byDay.set(day, (byDay.get(day) ?? 0) + point.visits);
  }
  return days.map((day) => byDay.get(day) ?? 0);
}

export function hasTrafficGroupBreakdown(
  group: GeoTrafficSourceGroup
): boolean {
  return (
    group.visitorType === "crawler" || group.key === GEO_TRAFFIC_OTHER_GROUP.key
  );
}

export function trafficVisitShare(visits: number, total: number): string {
  if (total === 0) {
    return "0%";
  }
  return `${Math.round((visits / total) * 100)}%`;
}

export function trafficGroupPurposeTotals(
  group: GeoTrafficSourceGroup
): GeoTrafficPurposeTotal[] {
  const totals = new Map<string, GeoTrafficPurposeTotal>();
  for (const member of group.members) {
    if (member.category.length === 0) {
      continue;
    }
    const existing = totals.get(member.category);
    if (existing === undefined) {
      totals.set(member.category, {
        category: member.category,
        visits: member.visits,
        members: [member.source],
      });
      continue;
    }
    existing.visits += member.visits;
    existing.members.push(member.source);
  }
  return [...totals.values()].sort((left, right) => right.visits - left.visits);
}
