import {
  CHART_MIN_BAR_PERCENT,
  CHART_OTHER_SLICE_LABEL,
  CHART_PERCENT_SCALE,
} from "@/constants/charts";
import {
  GEO_ENGINE_LABELS,
  GEO_MEMORY_LABEL,
  GEO_SEARCH_LABEL,
  GEO_SHARE_OF_VOICE_TOP_BRANDS,
} from "@/constants/geo";
import type {
  GeoCompetitor,
  GeoCompetitorSharePoint,
  GeoEngineFamily,
  GeoEngineFamilyTotals,
  GeoHeroSummary,
  GeoOverviewEngine,
  GeoSparklinePoint,
  GeoTimeseriesPoint,
  MentionRateRow,
  MentionRateSparklineOptions,
  MentionRateTrend,
  ShareOfVoiceDonutSlice,
  ShareOfVoiceRow,
} from "@/types/geo";
import { formatDayLabel } from "@/utils/analytics-charts";
import { chartKey } from "@/utils/chart-keys";
import { mergeCompetitorSharePoints } from "@/utils/geo-competitors";
import {
  GROUNDED_SUFFIX_PATTERN,
  isGroundedEngine,
} from "@/utils/geo-presence";

export function buildShareOfVoiceRows(
  points: readonly GeoCompetitorSharePoint[],
  options?: {
    limit?: number;
    competitors?: readonly GeoCompetitor[];
  }
): ShareOfVoiceRow[] {
  const limit = options?.limit ?? GEO_SHARE_OF_VOICE_TOP_BRANDS;
  const merged = mergeCompetitorSharePoints(points, options?.competitors);
  const top = merged.slice(0, limit);
  const rest = merged.slice(limit);
  const brands = top.map((point) => ({
    brand: point.brand,
    mentions: point.mentions,
  }));
  const otherTotal = rest.reduce((sum, point) => sum + point.mentions, 0);
  if (otherTotal > 0) {
    brands.push({ brand: CHART_OTHER_SLICE_LABEL, mentions: otherTotal });
  }
  const total = brands.reduce((sum, row) => sum + row.mentions, 0);
  return brands.map((row) => ({
    brand: row.brand,
    mentions: row.mentions,
    share: total > 0 ? row.mentions / total : 0,
  }));
}

export function toShareOfVoiceDonutSlices(
  rows: readonly ShareOfVoiceRow[]
): ShareOfVoiceDonutSlice[] {
  return rows.map((row, index) => ({
    ...row,
    slice: chartKey(`${row.brand}-${index}`),
  }));
}

export function formatMentionRate(rate: number): string {
  return `${Math.round(rate * CHART_PERCENT_SCALE)}%`;
}

export function formatChartPercent(value: number): string {
  return `${Math.round(value)}%`;
}

const SHARE_DECIMALS = 10;
const MIN_SHARE_PERCENT = 0.1;

export function formatUsageShare(share: number): string {
  const percent = share * CHART_PERCENT_SCALE;
  if (percent > 0 && percent < MIN_SHARE_PERCENT) {
    return `<${MIN_SHARE_PERCENT}%`;
  }
  return `${Math.round(percent * SHARE_DECIMALS) / SHARE_DECIMALS}%`;
}

export function barWidthPercent(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  return Math.max((value / max) * CHART_PERCENT_SCALE, CHART_MIN_BAR_PERCENT);
}

const DAY_MS = 86_400_000;

export function listDaysThrough(firstDay: string, lastDay: string): string[] {
  const start = new Date(`${firstDay}T00:00:00Z`);
  const end = new Date(`${lastDay}T00:00:00Z`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.getTime() > end.getTime()
  ) {
    return [];
  }
  const days: string[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += DAY_MS) {
    const day = new Date(time).toISOString().slice(0, 10);
    days.push(day);
  }
  return days;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function latestChartDay(lastKnownDay: string): string {
  const today = todayIsoDate();
  return lastKnownDay > today ? lastKnownDay : today;
}

function ratePercent(mentions: number, checks: number): number | null {
  if (checks <= 0) {
    return null;
  }
  return Math.round((mentions / checks) * CHART_PERCENT_SCALE);
}

export function mentionRateSparkline(
  points: readonly GeoTimeseriesPoint[],
  options?: MentionRateSparklineOptions
): GeoSparklinePoint[] {
  const family = options?.family;
  const mode = options?.mode ?? "all";
  const byDay = new Map<string, { mentions: number; checks: number }>();
  for (const point of points) {
    if (family && engineFamilyOf(point.engine) !== family) {
      continue;
    }
    if (mode === "search" && !isGroundedEngine(point.engine)) {
      continue;
    }
    if (mode === "memory" && isGroundedEngine(point.engine)) {
      continue;
    }
    const bucket = byDay.get(point.day) ?? { mentions: 0, checks: 0 };
    bucket.mentions += point.mentions;
    bucket.checks += point.checks;
    byDay.set(point.day, bucket);
  }
  return [...byDay.keys()].sort().flatMap((day) => {
    const bucket = byDay.get(day);
    if (!bucket) {
      return [];
    }
    const value = ratePercent(bucket.mentions, bucket.checks);
    return value === null ? [] : [{ day, value }];
  });
}

export function toSparklineSeries(points: readonly GeoSparklinePoint[]): {
  data: number[];
  labels: string[];
} {
  return {
    data: points.map((point) => point.value),
    labels: points.map((point) => formatDayLabel(point.day)),
  };
}

function daysWithSettledUsage(knownDays: readonly string[]): string[] {
  const settled = knownDays.filter((day) => day < todayIsoDate());
  return settled.length > 0 ? [...settled] : [...knownDays];
}

function engineHasUsage(
  engine: string,
  days: readonly string[],
  byDay: ReadonlyMap<string, ReadonlyMap<string, GeoTimeseriesPoint>>
): boolean {
  return days.some((day) => (byDay.get(day)?.get(engine)?.checks ?? 0) > 0);
}

export function buildMentionRateRows(
  points: GeoTimeseriesPoint[]
): MentionRateTrend {
  const byDay = new Map<string, Map<string, GeoTimeseriesPoint>>();
  for (const point of points) {
    const family = engineFamilyOf(point.engine);
    const dayPoints: Map<string, GeoTimeseriesPoint> =
      byDay.get(point.day) ?? new Map();
    const existing = dayPoints.get(family);
    dayPoints.set(family, {
      day: point.day,
      engine: family,
      checks: (existing?.checks ?? 0) + point.checks,
      mentions: (existing?.mentions ?? 0) + point.mentions,
    });
    byDay.set(point.day, dayPoints);
  }

  const knownDays = [...byDay.keys()].sort();
  const usageWindow = daysWithSettledUsage(knownDays);
  const engines = [
    ...new Set(points.map((point) => engineFamilyOf(point.engine))),
  ].filter((engine) => engineHasUsage(engine, usageWindow, byDay));
  const firstDay = knownDays.at(0);
  const lastDay = knownDays.at(-1);
  const days =
    firstDay && lastDay ? listDaysThrough(firstDay, lastDay) : knownDays;
  const rows = days.map((day) => {
    const row: MentionRateRow = { day: formatDayLabel(day), rawDay: day };
    const dayPoints = byDay.get(day);
    for (const engine of engines) {
      const point = dayPoints?.get(engine);
      row[chartKey(engine)] = point
        ? ratePercent(point.mentions, point.checks)
        : null;
    }
    return row;
  });

  const latest = [...rows]
    .reverse()
    .find((row) =>
      engines.some((engine) => typeof row[chartKey(engine)] === "number")
    );
  const ranked = [...engines].sort((left, right) => {
    const leftRate = Number(latest?.[chartKey(left)] ?? -1);
    const rightRate = Number(latest?.[chartKey(right)] ?? -1);
    return rightRate - leftRate;
  });

  return { rows, engines: ranked };
}

function poolRate(pool: GeoOverviewEngine[]): number | null {
  const checks = pool.reduce((total, engine) => total + engine.checks, 0);
  if (checks === 0) {
    return null;
  }
  const mentions = pool.reduce((total, engine) => total + engine.mentions, 0);
  return mentions / checks;
}

export function buildGeoHeroSummary(
  engines: GeoOverviewEngine[]
): GeoHeroSummary {
  const grounded = engines.filter((engine) => isGroundedEngine(engine.engine));
  const raw = engines.filter((engine) => !isGroundedEngine(engine.engine));
  const groundedRate = poolRate(grounded);
  const rawRate = poolRate(raw);
  const visibilityRate = groundedRate ?? poolRate(engines);
  const gapPoints =
    groundedRate !== null && rawRate !== null
      ? Math.round((groundedRate - rawRate) * CHART_PERCENT_SCALE)
      : null;
  const bestEngine =
    [...engines].sort((a, b) => b.mentionRate - a.mentionRate)[0] ?? null;
  return {
    visibilityRate,
    grounded: groundedRate !== null,
    gapPoints,
    bestEngine,
  };
}

export function gapInsight(gapPoints: number | null): string {
  if (gapPoints === null) {
    return "mention rate across all engines";
  }
  if (gapPoints > 0) {
    return `+${gapPoints} pts in ${GEO_SEARCH_LABEL} vs ${GEO_MEMORY_LABEL}`;
  }
  if (gapPoints < 0) {
    return `+${Math.abs(gapPoints)} pts in ${GEO_MEMORY_LABEL} vs ${GEO_SEARCH_LABEL}`;
  }
  return `${GEO_SEARCH_LABEL} and ${GEO_MEMORY_LABEL} on par`;
}

function engineFamilyOf(engine: string): string {
  return engine.replace(GROUNDED_SUFFIX_PATTERN, "");
}

export function engineFamilyLabel(family: string): string {
  return (
    GEO_ENGINE_LABELS[family] ??
    GEO_ENGINE_LABELS[`${family}-grounded`] ??
    family
  );
}

export function formatEngineFamily(engine: string): string {
  return engineFamilyLabel(engineFamilyOf(engine));
}

export function engineAnswerMode(engine: string): string {
  return isGroundedEngine(engine) ? GEO_SEARCH_LABEL : GEO_MEMORY_LABEL;
}

export function sharedEngineAnswerMode(
  engines: readonly string[]
): string | null {
  const first = engines[0];
  if (!first) {
    return null;
  }
  const mode = engineAnswerMode(first);
  return engines.every((engine) => engineAnswerMode(engine) === mode)
    ? mode
    : null;
}

export function formatEngineWithMode(engine: string): string {
  return `${formatEngineFamily(engine)} ${engineAnswerMode(engine)}`;
}

export function groupEngineFamilies(
  engines: GeoOverviewEngine[]
): GeoEngineFamily[] {
  const families = new Map<string, GeoEngineFamily>();
  for (const engine of engines) {
    const family = engineFamilyOf(engine.engine);
    const entry = families.get(family) ?? {
      family,
      web: null,
      raw: null,
    };
    if (isGroundedEngine(engine.engine)) {
      entry.web = engine;
    } else {
      entry.raw = engine;
    }
    families.set(family, entry);
  }
  return [...families.values()].sort(
    (a, b) =>
      Math.max(b.web?.mentionRate ?? 0, b.raw?.mentionRate ?? 0) -
      Math.max(a.web?.mentionRate ?? 0, a.raw?.mentionRate ?? 0)
  );
}

export function engineFamilyTotals(
  family: GeoEngineFamily
): GeoEngineFamilyTotals | null {
  const sources = [family.web, family.raw].filter(
    (engine): engine is GeoOverviewEngine => engine !== null
  );
  if (sources.length === 0) {
    return null;
  }
  const mentions = sources.reduce((sum, engine) => sum + engine.mentions, 0);
  const checks = sources.reduce((sum, engine) => sum + engine.checks, 0);
  return { mentions, checks, rate: checks === 0 ? 0 : mentions / checks };
}
