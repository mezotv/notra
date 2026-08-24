import {
  CHART_MIN_BAR_PERCENT,
  CHART_OTHER_SLICE_LABEL,
  CHART_PERCENT_SCALE,
} from "@/constants/charts";
import {
  GEO_BRAND_LABELS,
  GEO_ENGINE_LABELS,
  GEO_MENTION_TREND_TOTAL_KEY,
  GEO_SEARCH_LABEL,
  GEO_SHARE_OF_VOICE_TOP_BRANDS,
} from "@/constants/geo";
import type {
  EngineFamilyModeTrendRow,
  GeoCompetitor,
  GeoCompetitorSharePoint,
  GeoEngineFamily,
  GeoEngineFamilyTotals,
  GeoEngineMode,
  GeoEngineVariant,
  GeoOverviewEngine,
  GeoSparklinePoint,
  GeoTimeseriesPoint,
  MentionRateSparklineOptions,
  MentionTrend,
  MentionTrendRow,
  ShareOfVoiceDonutSlice,
  ShareOfVoiceRow,
} from "@/types/geo";
import { formatDayLabel, todayIsoDate } from "@/utils/analytics-charts";
import { chartKey } from "@/utils/chart-keys";
import { mergeCompetitorSharePoints } from "@/utils/geo-competitors";
import { resolveEngineIconKey } from "@/utils/geo-engine-icon";
import {
  GROUNDED_SUFFIX_PATTERN,
  isGroundedEngine,
} from "@/utils/geo-presence";

const GPT_PREFIX_PATTERN = /^gpt-/i;
const MINI_SUFFIX_PATTERN = /-mini$/i;

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

export function formatChartInteger(value: number): string {
  return Math.round(value).toLocaleString("en-US");
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
  if (max <= 0 || value <= 0) {
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

function visibleEngineStats(
  row: MentionTrendRow,
  keys: readonly string[]
): { total: number; count: number } | null {
  let total = 0;
  let count = 0;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && value > 0) {
      total += value;
      count += 1;
    }
  }
  return count > 0 ? { total, count } : null;
}

function rowVisibleAverage(
  row: MentionTrendRow,
  keys: readonly string[]
): number | null {
  const stats = visibleEngineStats(row, keys);
  return stats ? stats.total / stats.count : null;
}

export function fitMentionTrendAverage(
  rows: readonly MentionTrendRow[],
  keys: readonly string[]
): (number | null)[] {
  return rows.map((row) => rowVisibleAverage(row, keys));
}

export function mentionTrendEmptyLabel(
  row: Record<string, unknown> | undefined,
  keys: readonly string[]
): string {
  const scanned =
    row != null && keys.some((key) => typeof row[key] === "number");
  return scanned ? "No mentions" : "Not scanned";
}

export function latestChartDay(
  lastKnownDay: string,
  today = todayIsoDate()
): string {
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
  const model = options?.model;
  const mode = options?.mode ?? "all";
  const byDay = new Map<string, { mentions: number; checks: number }>();
  for (const point of points) {
    if (family && engineFamilyOf(point.engine) !== family) {
      continue;
    }
    if (model && engineModelOf(point.engine) !== model) {
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

export function mentionRateSparklineLabel(
  points: readonly GeoSparklinePoint[]
): string {
  const first = points[0];
  const last = points.at(-1);
  if (!(first && last)) {
    return "Mention rate trend";
  }
  const from = formatChartPercent(first.value);
  const to = formatChartPercent(last.value);
  if (points.length === 1) {
    return `Mention rate ${from}`;
  }
  if (from === to) {
    return `Mention rate held at ${to} over ${points.length} days`;
  }
  return `Mention rate ${from} to ${to} over ${points.length} days`;
}

function daysWithSettledUsage(knownDays: readonly string[]): string[] {
  const settled = knownDays.filter((day) => day < todayIsoDate());
  return settled.length > 0 ? [...settled] : [...knownDays];
}

function engineMentionTotal(
  engine: string,
  days: readonly string[],
  byDay: ReadonlyMap<string, ReadonlyMap<string, GeoTimeseriesPoint>>
): number {
  return days.reduce(
    (total, day) => total + (byDay.get(day)?.get(engine)?.mentions ?? 0),
    0
  );
}

export function buildMentionTrendRows(
  points: GeoTimeseriesPoint[]
): MentionTrend {
  const byDay = new Map<string, Map<string, GeoTimeseriesPoint>>();
  for (const point of points) {
    const model = engineModelOf(point.engine);
    const dayPoints: Map<string, GeoTimeseriesPoint> =
      byDay.get(point.day) ?? new Map();
    const existing = dayPoints.get(model);
    dayPoints.set(model, {
      day: point.day,
      engine: model,
      checks: (existing?.checks ?? 0) + point.checks,
      mentions: (existing?.mentions ?? 0) + point.mentions,
    });
    byDay.set(point.day, dayPoints);
  }

  const knownDays = [...byDay.keys()].sort();
  const usageWindow = daysWithSettledUsage(knownDays);
  const engines = [
    ...new Set(points.map((point) => engineModelOf(point.engine))),
  ];
  const firstDay = knownDays.at(0);
  const lastDay = knownDays.at(-1);
  const days =
    firstDay && lastDay ? listDaysThrough(firstDay, lastDay) : knownDays;
  const rows = days.map((day) => {
    const row: MentionTrendRow = { day: formatDayLabel(day), rawDay: day };
    const dayPoints = byDay.get(day);
    let total = 0;
    let sampled = false;
    for (const engine of engines) {
      const point = dayPoints?.get(engine);
      row[chartKey(engine)] = point ? point.mentions : null;
      if (point) {
        total += point.mentions;
        sampled = true;
      }
    }
    row[GEO_MENTION_TREND_TOTAL_KEY] = sampled ? total : null;
    return row;
  });

  const ranked = [...engines].sort(
    (left, right) =>
      engineMentionTotal(right, usageWindow, byDay) -
      engineMentionTotal(left, usageWindow, byDay)
  );

  return { rows, engines: ranked };
}

export function engineModelOf(engine: string): string {
  return engine.replace(GROUNDED_SUFFIX_PATTERN, "");
}

export function engineFamilyOf(engine: string): string {
  return resolveEngineIconKey(engine) ?? engineModelOf(engine);
}

export function engineFamilyLabel(family: string): string {
  return (
    GEO_BRAND_LABELS[family] ??
    GEO_ENGINE_LABELS[family] ??
    GEO_ENGINE_LABELS[`${family}-grounded`] ??
    family
  );
}

export function engineVariantLabel(model: string, brandLabel: string): string {
  const label = engineFamilyLabel(model);
  const prefix = `${brandLabel} `;
  if (label.startsWith(prefix)) {
    return label.slice(prefix.length);
  }
  if (label !== brandLabel) {
    return label;
  }
  const slug = engineModelOf(model).split("/").at(-1);
  if (slug?.toLowerCase().startsWith("gpt-")) {
    return slug
      .replace(GPT_PREFIX_PATTERN, "GPT-")
      .replace(MINI_SUFFIX_PATTERN, " mini");
  }
  return label;
}

export function formatEngineFamily(engine: string): string {
  const model = engineModelOf(engine);
  return (
    GEO_ENGINE_LABELS[model] ??
    GEO_ENGINE_LABELS[engine] ??
    GEO_ENGINE_LABELS[`${model}-grounded`] ??
    engineFamilyLabel(engineFamilyOf(engine))
  );
}

export function engineAnswerMode(engine: string): string | null {
  return isGroundedEngine(engine) ? GEO_SEARCH_LABEL : null;
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
  const family = formatEngineFamily(engine);
  const mode = engineAnswerMode(engine);
  return mode ? `${family} ${mode}` : family;
}

export function engineFamilySources(
  family: GeoEngineFamily
): GeoOverviewEngine[] {
  return family.variants.flatMap((variant) =>
    [variant.web, variant.raw].filter(
      (engine): engine is GeoOverviewEngine => engine !== null
    )
  );
}

export function engineFamilyAvgPosition(
  family: GeoEngineFamily
): number | null {
  const ranked = engineFamilySources(family)
    .filter((engine) => engine.avgPosition !== null)
    .sort((left, right) => right.checks - left.checks);
  return ranked[0]?.avgPosition ?? null;
}

export function engineFamilyLastCheckedAt(
  family: GeoEngineFamily
): string | null {
  let latest: string | null = null;
  for (const engine of engineFamilySources(family)) {
    if (
      engine.lastCheckedAt &&
      (latest === null || engine.lastCheckedAt > latest)
    ) {
      latest = engine.lastCheckedAt;
    }
  }
  return latest;
}

function emptyVariant(model: string): GeoEngineVariant {
  return { model, web: null, raw: null };
}

function variantPeakRate(variant: GeoEngineVariant): number {
  return Math.max(variant.web?.mentionRate ?? 0, variant.raw?.mentionRate ?? 0);
}

export function groupEngineFamilies(
  engines: GeoOverviewEngine[]
): GeoEngineFamily[] {
  const families = new Map<string, Map<string, GeoEngineVariant>>();
  for (const engine of engines) {
    const family = engineFamilyOf(engine.engine);
    const model = engineModelOf(engine.engine);
    const variants = families.get(family) ?? new Map();
    const variant = variants.get(model) ?? emptyVariant(model);
    if (isGroundedEngine(engine.engine)) {
      variant.web = engine;
    } else {
      variant.raw = engine;
    }
    variants.set(model, variant);
    families.set(family, variants);
  }
  return [...families.entries()]
    .map(([family, variants]) => ({
      family,
      variants: [...variants.values()].sort(
        (left, right) => variantPeakRate(right) - variantPeakRate(left)
      ),
    }))
    .sort((left, right) => familySortRate(right) - familySortRate(left));
}

export function engineFamilyTotals(
  family: GeoEngineFamily
): GeoEngineFamilyTotals | null {
  return totalsForEngines(engineFamilySources(family));
}

export function engineFamilyModeTotals(
  family: GeoEngineFamily,
  mode: GeoEngineMode
): GeoEngineFamilyTotals | null {
  return totalsForEngines(
    engineFamilySources(family).filter((engine) =>
      mode === "search"
        ? isGroundedEngine(engine.engine)
        : !isGroundedEngine(engine.engine)
    )
  );
}

function totalsForEngines(
  sources: readonly GeoOverviewEngine[]
): GeoEngineFamilyTotals | null {
  if (sources.length === 0) {
    return null;
  }
  const mentions = sources.reduce((sum, engine) => sum + engine.mentions, 0);
  const checks = sources.reduce((sum, engine) => sum + engine.checks, 0);
  return { mentions, checks, rate: checks === 0 ? 0 : mentions / checks };
}

export function buildEngineFamilyModeTrendRows(
  points: readonly GeoTimeseriesPoint[],
  family: string
): EngineFamilyModeTrendRow[] {
  const search = mentionRateSparkline(points, { family, mode: "search" });
  const memory = mentionRateSparkline(points, { family, mode: "memory" });
  const searchByDay = new Map(search.map((point) => [point.day, point.value]));
  const memoryByDay = new Map(memory.map((point) => [point.day, point.value]));
  const knownDays = [
    ...new Set([...searchByDay.keys(), ...memoryByDay.keys()]),
  ].sort();
  const firstDay = knownDays.at(0);
  const lastDay = knownDays.at(-1);
  const days =
    firstDay && lastDay ? listDaysThrough(firstDay, lastDay) : knownDays;

  return days.map((day) => ({
    day: formatDayLabel(day),
    rawDay: day,
    search: searchByDay.get(day) ?? null,
    memory: memoryByDay.get(day) ?? null,
  }));
}

function familySortRate(family: GeoEngineFamily): number {
  return engineFamilyTotals(family)?.rate ?? -1;
}
