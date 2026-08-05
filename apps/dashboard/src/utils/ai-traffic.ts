import {
  GEO_AI_REFERRER_LABELS,
  GEO_JOURNEY_CHIP_LENGTH,
  GEO_JOURNEY_EXPLICIT_PREFIX,
  GEO_TRAFFIC_LOG_FILTER_ALL,
} from "@/constants/geo";
import type {
  GeoTrafficLogFilters,
  GeoTrafficLogPurposeFilter,
  GeoTrafficLogVisitorFilter,
  GeoTrafficSource,
  GeoTrafficTotals,
  GeoVisitorType,
} from "@/types/geo";

const PERCENT = 100;
const MIN_BAR_PERCENT = 2;

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

export function hitBarWidth(hits: number, maxHits: number): number {
  if (maxHits <= 0) {
    return 0;
  }
  return Math.max((hits / maxHits) * PERCENT, MIN_BAR_PERCENT);
}

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatAiTrafficTimestamp(value: string): string {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return timestampFormatter.format(date);
}

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

function toDate(value: string): Date {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  return new Date(normalized);
}

export function formatGeoJourneyChip(journeyId: string): string {
  return journeyId.slice(-GEO_JOURNEY_CHIP_LENGTH);
}

export function toGeoJourneyKind(journeyId: string): "tagged" | "fingerprint" {
  return journeyId.startsWith(GEO_JOURNEY_EXPLICIT_PREFIX)
    ? "tagged"
    : "fingerprint";
}

export function toGeoTrafficLogVisitorFilter(
  value: GeoTrafficLogFilters["visitorType"]
): GeoTrafficLogVisitorFilter | undefined {
  return value === GEO_TRAFFIC_LOG_FILTER_ALL ? undefined : value;
}

export function toGeoTrafficLogPurposeFilter(
  value: GeoTrafficLogFilters["category"]
): GeoTrafficLogPurposeFilter | undefined {
  return value === GEO_TRAFFIC_LOG_FILTER_ALL ? undefined : value;
}

export function formatGeoJourneySpan(
  firstSeenAt: string,
  lastSeenAt: string
): string {
  const start = toDate(firstSeenAt);
  const end = toDate(lastSeenAt);
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
