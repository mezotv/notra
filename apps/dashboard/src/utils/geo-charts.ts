import type { GeoTimeseriesPoint, MentionRateRow } from "@/types/geo";
import { formatDayLabel } from "@/utils/analytics-charts";

const PERCENT = 100;

export function formatMentionRate(rate: number): string {
  return `${Math.round(rate * PERCENT)}%`;
}

const SHARE_DECIMALS = 10;
const MIN_SHARE_PERCENT = 0.1;

export function formatUsageShare(share: number): string {
  const percent = share * PERCENT;
  if (percent > 0 && percent < MIN_SHARE_PERCENT) {
    return `<${MIN_SHARE_PERCENT}%`;
  }
  return `${Math.round(percent * SHARE_DECIMALS) / SHARE_DECIMALS}%`;
}

export function usageBarWidth(share: number, maxShare: number): number {
  if (maxShare <= 0) {
    return 0;
  }
  return Math.max((share / maxShare) * PERCENT, 2);
}

export function buildMentionRateRows(points: GeoTimeseriesPoint[]): {
  rows: MentionRateRow[];
  engines: string[];
} {
  const engines = [...new Set(points.map((point) => point.engine))];
  const byDay = new Map<string, Map<string, GeoTimeseriesPoint>>();
  for (const point of points) {
    const dayPoints = byDay.get(point.day) ?? new Map();
    dayPoints.set(point.engine, point);
    byDay.set(point.day, dayPoints);
  }

  const days = [...byDay.keys()].sort();
  const rows = days.map((day) => {
    const row: MentionRateRow = { day: formatDayLabel(day), rawDay: day };
    const dayPoints = byDay.get(day);
    for (const engine of engines) {
      const point = dayPoints?.get(engine);
      row[engine] =
        point && point.checks > 0
          ? Math.round((point.mentions / point.checks) * PERCENT)
          : 0;
    }
    return row;
  });

  return { rows, engines };
}
