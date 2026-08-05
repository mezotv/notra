import type { FunnelStage } from "@/components/charts/funnel-chart";
import { DONUT_SLICE_COLORS } from "@/constants/charts";
import { GEO_JOURNEY_DEPTH_THRESHOLDS } from "@/constants/geo";
import type {
  GeoJourney,
  GeoJourneyDetailPoint,
  GeoJourneyEvent,
} from "@/types/geo";

const WWW_PREFIX = /^www\./;

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

function toDate(value: string): Date {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  return new Date(normalized);
}

export function formatGeoJourneyClock(value: string): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return clockFormatter.format(date);
}

export function buildGeoJourneyPoints(
  events: readonly GeoJourneyEvent[]
): GeoJourneyDetailPoint[] {
  return events.map((event, index) => ({
    point: `${formatGeoJourneyClock(event.capturedAt)} · ${event.path}`,
    pages: index + 1,
  }));
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

function journeyDepthColor(index: number): string {
  const pair = DONUT_SLICE_COLORS[index % DONUT_SLICE_COLORS.length];
  return pair?.light ?? "#7C5CF0";
}

export function buildJourneyDepthFunnel(
  journeys: readonly GeoJourney[]
): FunnelStage[] {
  return GEO_JOURNEY_DEPTH_THRESHOLDS.map((threshold, index) => ({
    label: threshold === 1 ? "All journeys" : `${threshold}+ pages`,
    value: journeys.filter((journey) => journey.pages >= threshold).length,
    color: journeyDepthColor(index),
  })).filter((stage, index) => index === 0 || stage.value > 0);
}
