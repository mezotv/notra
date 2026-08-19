import { parseClickHouseDateTime } from "@notra/analytics/utils/datetime";
import {
  GEO_AI_REFERRER_LABELS,
  GEO_JOURNEY_CHIP_LENGTH,
  GEO_JOURNEY_EXPLICIT_PREFIX,
} from "@/constants/geo";
import type {
  GeoTrafficLogFilters,
  GeoTrafficLogPurposeFilter,
  GeoTrafficLogVisitorFilter,
  GeoTrafficSource,
  GeoTrafficTotals,
  GeoVisitorType,
} from "@/types/geo";

const VISITOR_TYPES: readonly GeoVisitorType[] = [
  "crawler",
  "ai_referral",
  "human",
  "unknown",
];

export function toGeoVisitorType(value: string): GeoVisitorType {
  return VISITOR_TYPES.find((type) => type === value) ?? "unknown";
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
  const totals: GeoTrafficTotals = { crawler: 0, aiReferral: 0, human: 0 };
  for (const source of sources) {
    if (source.visitorType === "crawler") {
      totals.crawler += source.visits;
    } else if (source.visitorType === "ai_referral") {
      totals.aiReferral += source.visits;
    } else if (source.visitorType === "human") {
      totals.human += source.visits;
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
