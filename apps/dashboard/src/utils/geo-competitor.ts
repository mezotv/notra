import type {
  GeoCompetitorDetailPoint,
  GeoCompetitorTimeseriesPoint,
} from "@/types/geo";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatGeoCompetitorDay(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dayFormatter.format(date);
}

export function buildGeoCompetitorPoints(
  points: readonly GeoCompetitorTimeseriesPoint[]
): GeoCompetitorDetailPoint[] {
  return points.map((point) => ({
    day: formatGeoCompetitorDay(point.day),
    mentions: point.mentions,
  }));
}
