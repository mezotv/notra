import type {
  GeoCompetitorDetailPoint,
  GeoCompetitorMentionStats,
  GeoCompetitorTimeseriesPoint,
} from "@/types/geo";
import { formatDayLabel, todayIsoDate } from "@/utils/analytics-charts";
import { latestChartDay, listDaysThrough } from "@/utils/geo-charts";

export function buildGeoCompetitorPoints(
  points: readonly GeoCompetitorTimeseriesPoint[],
  today = todayIsoDate()
): GeoCompetitorDetailPoint[] {
  const byDay = new Map(points.map((point) => [point.day, point.mentions]));
  const knownDays = [...byDay.keys()].sort();
  const firstDay = knownDays.at(0);
  const lastDay = knownDays.at(-1);
  const days =
    firstDay && lastDay
      ? listDaysThrough(firstDay, latestChartDay(lastDay, today))
      : knownDays;
  return days.map((day) => ({
    day: formatDayLabel(day),
    rawDay: day,
    mentions: byDay.get(day) ?? 0,
  }));
}

export function competitorChartHasIncompleteTail(
  points: readonly GeoCompetitorDetailPoint[],
  today = todayIsoDate()
): boolean {
  return points.at(-1)?.rawDay === today;
}

export function competitorMentionStats(
  points: readonly GeoCompetitorDetailPoint[],
  today = todayIsoDate()
): GeoCompetitorMentionStats | null {
  const last = points.at(-1);
  if (!last) {
    return null;
  }
  const series =
    last.rawDay === today && last.mentions === 0 ? points.slice(0, -1) : points;
  const latest = series.at(-1);
  if (!latest) {
    return null;
  }
  let peak = latest;
  for (const point of series) {
    if (point.mentions > peak.mentions) {
      peak = point;
    }
  }
  return {
    latest: latest.mentions,
    latestDay: latest.day,
    peak: peak.mentions,
  };
}
