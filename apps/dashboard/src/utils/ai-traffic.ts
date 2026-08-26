import { parseClickHouseDateTime } from "@notra/analytics/utils/datetime";
import {
  GEO_AI_REFERRER_LABELS,
  GEO_JOURNEY_CHIP_LENGTH,
  GEO_JOURNEY_EXPLICIT_PREFIX,
  GEO_TRAFFIC_TREND_CRAWLER_KEY,
  GEO_TRAFFIC_TREND_REFERRAL_KEY,
  GEO_UNTRACKED_VISITOR_TYPES,
} from "@/constants/geo";
import type {
  GeoTrafficLogFilters,
  GeoTrafficLogPurposeFilter,
  GeoTrafficLogVisitorFilter,
  GeoTrafficPoint,
  GeoTrafficSource,
  GeoTrafficTotals,
  GeoTrafficTrendRow,
  GeoVisitorType,
} from "@/types/geo";
import { formatDayLabel } from "@/utils/analytics-charts";

const VISITOR_TYPES: readonly GeoVisitorType[] = [
  "crawler",
  "ai_referral",
  "human",
  "unknown",
];

export function toGeoVisitorType(value: string): GeoVisitorType {
  return VISITOR_TYPES.find((type) => type === value) ?? "unknown";
}

export function isTrackedGeoVisitorType(value: GeoVisitorType): boolean {
  return !GEO_UNTRACKED_VISITOR_TYPES.includes(value);
}

export function formatGeoSource(
  source: string,
  visitorType: GeoVisitorType
): string {
  if (visitorType === "ai_referral") {
    return GEO_AI_REFERRER_LABELS[source] ?? source;
  }
  return source;
}

export function toGeoTrafficTotals(
  sources: readonly GeoTrafficSource[]
): GeoTrafficTotals {
  const totals: GeoTrafficTotals = { crawler: 0, aiReferral: 0 };
  for (const source of sources) {
    if (source.visitorType === "crawler") {
      totals.crawler += source.visits;
    } else if (source.visitorType === "ai_referral") {
      totals.aiReferral += source.visits;
    }
  }
  return totals;
}

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatAiTrafficTimestamp(value: string): string {
  const date = parseClickHouseDateTime(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return timestampFormatter.format(date);
}

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export function formatGeoJourneyChip(journeyId: string): string {
  return journeyId.slice(-GEO_JOURNEY_CHIP_LENGTH);
}

export function toGeoJourneyKind(journeyId: string): "tagged" | "fingerprint" {
  return journeyId.startsWith(GEO_JOURNEY_EXPLICIT_PREFIX)
    ? "tagged"
    : "fingerprint";
}

export function formatGeoTrafficFilterLabel(
  base: string,
  noun: string,
  selected: readonly string[],
  options: readonly { value: string; label: string }[]
): string {
  const first = selected[0];
  if (first === undefined) {
    return base;
  }
  if (selected.length === 1) {
    return options.find((option) => option.value === first)?.label ?? first;
  }
  return `${noun} (${selected.length})`;
}

export function toggleGeoTrafficFilterValue<T extends string>(
  values: T[],
  value: T
): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function toGeoTrafficLogVisitorFilter(
  values: GeoTrafficLogFilters["visitorTypes"]
): GeoTrafficLogVisitorFilter[] | undefined {
  return values.length > 0 ? values : undefined;
}

export function toGeoTrafficLogPurposeFilter(
  values: GeoTrafficLogFilters["categories"]
): GeoTrafficLogPurposeFilter[] | undefined {
  return values.length > 0 ? values : undefined;
}

export function formatGeoJourneySpan(
  firstSeenAt: string,
  lastSeenAt: string
): string {
  const start = parseClickHouseDateTime(firstSeenAt);
  const end = parseClickHouseDateTime(lastSeenAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  const minutes = Math.max(
    Math.round((end.getTime() - start.getTime()) / MS_PER_MINUTE),
    0
  );
  if (minutes < 1) {
    return "under a minute";
  }
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) {
    return `${hours}h ${minutes % MINUTES_PER_HOUR}m`;
  }
  return `${Math.floor(hours / HOURS_PER_DAY)}d ${hours % HOURS_PER_DAY}h`;
}

export function formatMarkdownShare(markdown: number, visits: number): string {
  if (visits === 0) {
    return "-";
  }
  return `${Math.round((markdown / visits) * 100)}%`;
}

export function trafficDayKey(day: string): string {
  return String(day).slice(0, 10);
}

export function trafficSourceKey(
  source: string,
  visitorType: GeoVisitorType
): string {
  return `${visitorType}:${source}`;
}

export function hasTrafficSourceSeries(
  points: readonly GeoTrafficPoint[]
): boolean {
  return points.some((point) => point.source.length > 0);
}

export function trafficSparklineDays(
  points: readonly GeoTrafficPoint[]
): string[] {
  return [...new Set(points.map((point) => trafficDayKey(point.day)))].sort();
}

export function buildTrafficTrendRows(
  points: readonly GeoTrafficPoint[]
): GeoTrafficTrendRow[] {
  const byDay = new Map<string, { crawler: number; aiReferral: number }>();

  for (const point of points) {
    if (
      point.visitorType !== "crawler" &&
      point.visitorType !== "ai_referral"
    ) {
      continue;
    }

    const day = trafficDayKey(point.day);
    const current = byDay.get(day) ?? { crawler: 0, aiReferral: 0 };
    if (point.visitorType === "crawler") {
      current.crawler += point.visits;
    } else {
      current.aiReferral += point.visits;
    }
    byDay.set(day, current);
  }

  return [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, values]) => ({
      day: formatDayLabel(day),
      rawDay: day,
      [GEO_TRAFFIC_TREND_CRAWLER_KEY]: values.crawler,
      [GEO_TRAFFIC_TREND_REFERRAL_KEY]: values.aiReferral,
    }));
}

export function buildTrafficSourceSeries(
  points: readonly GeoTrafficPoint[],
  source: string,
  visitorType: GeoVisitorType,
  days: readonly string[]
): number[] {
  const byDay = new Map<string, number>();
  for (const point of points) {
    if (point.source !== source || point.visitorType !== visitorType) {
      continue;
    }
    const day = trafficDayKey(point.day);
    byDay.set(day, (byDay.get(day) ?? 0) + point.visits);
  }
  return days.map((day) => byDay.get(day) ?? 0);
}

export type TrafficDeltaTone = "up" | "down" | "flat";

export function trafficDeltaTone(delta: number): TrafficDeltaTone {
  const rounded = Math.round(delta);
  if (rounded > 0) {
    return "up";
  }
  if (rounded < 0) {
    return "down";
  }
  return "flat";
}

export function formatTrafficDelta(delta: number): string {
  const rounded = Math.round(Math.abs(delta));
  return `${delta >= 0 ? "+" : "-"}${rounded}%`;
}

export function isTrafficPagePending({
  isSettingsPending,
  hasSettings,
  isTrafficPending,
  isEmptyTraffic,
  isIngestPending,
}: {
  isSettingsPending: boolean;
  hasSettings: boolean;
  isTrafficPending: boolean;
  isEmptyTraffic: boolean;
  isIngestPending: boolean;
}): boolean {
  if (isSettingsPending) {
    return true;
  }
  if (!hasSettings) {
    return false;
  }
  if (isTrafficPending) {
    return true;
  }
  return isEmptyTraffic && isIngestPending;
}

export function trafficVisitDelta(
  current: number,
  previous: number
): number | null {
  if (current === 0 && previous === 0) {
    return null;
  }
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return ((current - previous) / previous) * 100;
}
