import type {
  GeoCompetitorDetailPoint,
  GeoCompetitorTimeseriesPoint,
} from "@/types/geo";
import { formatDayLabel } from "@/utils/analytics-charts";
import { latestChartDay, listDaysThrough } from "@/utils/geo-charts";

export function buildGeoCompetitorPoints(
  points: readonly GeoCompetitorTimeseriesPoint[]
): GeoCompetitorDetailPoint[] {
  const byDay = new Map(points.map((point) => [point.day, point.mentions]));
  const knownDays = [...byDay.keys()].sort();
  const firstDay = knownDays.at(0);
  const lastDay = knownDays.at(-1);
  const days =
    firstDay && lastDay
      ? listDaysThrough(firstDay, latestChartDay(lastDay))
      : knownDays;
  return days.map((day) => ({
    day: formatDayLabel(day),
    mentions: byDay.get(day) ?? 0,
  }));
}
