import type {
  GeoCompetitorSharePoint,
  GeoOverviewEngine,
  GeoTimeseriesPoint,
} from "@/types/geo";
import type {
  GeoDirectionEngineRow,
  GeoDirectionTone,
  GeoDirectionTrendRow,
} from "@/types/geo-directions";

const PERCENT = 100;
const MIN_BAR_PERCENT = 3;

export function formatDirectionRate(rate: number): string {
  return `${Math.round(rate * PERCENT)}%`;
}

export function formatDirectionCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatDirectionDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }
  return String(delta);
}

export function directionDeltaTone(delta: number): GeoDirectionTone {
  if (delta > 0) {
    return "up";
  }
  if (delta < 0) {
    return "down";
  }
  return "flat";
}

const TOP_POSITION = 2;
const MID_POSITION = 4;

export function directionPositionTone(position: number): string {
  if (position <= TOP_POSITION) {
    return "top";
  }
  if (position <= MID_POSITION) {
    return "mid";
  }
  return "low";
}

export function directionBarWidth(rate: number, maxRate: number): number {
  if (maxRate <= 0) {
    return 0;
  }
  return Math.max((rate / maxRate) * PERCENT, MIN_BAR_PERCENT);
}

export function directionShareOf(
  point: GeoCompetitorSharePoint,
  points: readonly GeoCompetitorSharePoint[]
): number {
  const total = points.reduce((sum, entry) => sum + entry.mentions, 0);
  if (total <= 0) {
    return 0;
  }
  return point.mentions / total;
}

export function buildDirectionOverviewEngines(
  rows: readonly GeoDirectionEngineRow[],
  lastCheckedAt: string
): GeoOverviewEngine[] {
  return rows.map((row) => ({
    engine: row.engine,
    checks: row.checks,
    mentions: Math.round(row.rate * row.checks),
    mentionRate: row.rate,
    avgPosition: row.avgPosition,
    lastCheckedAt,
  }));
}

export function buildDirectionTrendRows(
  days: readonly string[],
  grounded: readonly number[],
  training: readonly number[]
): GeoDirectionTrendRow[] {
  return days.map((day, index) => ({
    day,
    grounded: grounded[index] ?? 0,
    training: training[index] ?? 0,
  }));
}

export function buildDirectionTimeseries(
  days: readonly string[],
  grounded: readonly number[],
  training: readonly number[],
  groundedEngine: string,
  trainingEngine: string
): GeoTimeseriesPoint[] {
  const points: GeoTimeseriesPoint[] = [];
  days.forEach((day, index) => {
    points.push({
      day,
      engine: groundedEngine,
      checks: PERCENT,
      mentions: grounded[index] ?? 0,
    });
    points.push({
      day,
      engine: trainingEngine,
      checks: PERCENT,
      mentions: training[index] ?? 0,
    });
  });
  return points;
}
