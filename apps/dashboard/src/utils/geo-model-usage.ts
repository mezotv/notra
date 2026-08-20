import { GEO_MODEL_USAGE_TREND_WEEKS } from "@/constants/geo";
import type {
  GeoModelUsagePoint,
  GeoModelUsageRow,
  ModelUsageChart,
  ModelUsageChartRow,
  ModelUsageChartSeries,
} from "@/types/geo";
import { formatDayLabel, todayIsoDate } from "@/utils/analytics-charts";
import { chartKey } from "@/utils/chart-keys";

const DAY_MS = 86_400_000;
const SUNDAY = 0;
const MONDAY_FROM_SUNDAY = -6;

export function isoWeekMonday(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate.slice(0, 10);
  }
  const day = date.getUTCDay();
  const offset = day === SUNDAY ? MONDAY_FROM_SUNDAY : 1 - day;
  return new Date(date.getTime() + offset * DAY_MS).toISOString().slice(0, 10);
}

function snapshotPoints(
  models: readonly GeoModelUsageRow[],
  capturedAt: string | null
): GeoModelUsagePoint[] {
  if (models.length === 0) {
    return [];
  }
  const week = isoWeekMonday(capturedAt ?? todayIsoDate());
  return models.map((model) => ({
    week,
    model: model.model,
    share: model.share,
    tokens: model.rawTokens,
  }));
}

function hasTokenVolume(points: readonly GeoModelUsagePoint[]): boolean {
  return points.some((point) => (point.tokens ?? 0) > 0);
}

function featuredTotal(
  row: ModelUsageChartRow,
  series: readonly ModelUsageChartSeries[]
): number {
  let total = 0;
  for (const entry of series) {
    const value = row[entry.key];
    if (typeof value === "number") {
      total += value;
    }
  }
  return total;
}

export function buildModelUsageChart(
  models: readonly GeoModelUsageRow[],
  points: readonly GeoModelUsagePoint[],
  capturedAt: string | null,
  today = todayIsoDate()
): ModelUsageChart {
  const source =
    points.length > 0 ? points : snapshotPoints(models, capturedAt);
  const featured = models.map((model) => model.model);
  const featuredSet = new Set(featured);
  const featuredLabels = new Map(
    models.map((model) => [model.model, model.label])
  );
  const metric = hasTokenVolume(source) ? "tokens" : "share";
  const byWeek = new Map<string, GeoModelUsagePoint[]>();
  for (const point of source) {
    const bucket = byWeek.get(point.week);
    if (bucket) {
      bucket.push(point);
      continue;
    }
    byWeek.set(point.week, [point]);
  }
  const weeks = [...byWeek.keys()].sort().slice(-GEO_MODEL_USAGE_TREND_WEEKS);
  const series: ModelUsageChartSeries[] = featured.map((model) => ({
    key: chartKey(model),
    model,
    label: featuredLabels.get(model) ?? model,
  }));

  const rows = weeks.map((week) => {
    const row: ModelUsageChartRow = {
      week: formatDayLabel(week),
      rawWeek: week,
    };
    const featuredValues = new Map<string, number>();
    for (const point of byWeek.get(week) ?? []) {
      if (!featuredSet.has(point.model)) {
        continue;
      }
      const value = metric === "tokens" ? (point.tokens ?? 0) : point.share;
      featuredValues.set(
        point.model,
        (featuredValues.get(point.model) ?? 0) + value
      );
    }
    for (const model of featured) {
      row[chartKey(model)] = featuredValues.get(model) ?? 0;
    }
    return row;
  });

  const firstActive = rows.findIndex((row) => featuredTotal(row, series) > 0);
  const visibleRows = firstActive === -1 ? [] : rows.slice(firstActive);
  const lastWeek = visibleRows.at(-1)?.rawWeek;

  return {
    rows: visibleRows,
    series,
    metric,
    incompleteTail: lastWeek === isoWeekMonday(today),
  };
}
