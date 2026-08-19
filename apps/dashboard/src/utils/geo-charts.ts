import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import { GEO_ENGINE_LABELS } from "@/constants/geo";
import type {
  GeoCompetitorSharePoint,
  GeoEngineFamily,
  GeoHeroSummary,
  GeoOverviewEngine,
  GeoTimeseriesPoint,
  MentionRateRow,
  ShareOfVoiceRow,
} from "@/types/geo";
import { formatDayLabel } from "@/utils/analytics-charts";
import { chartKey } from "@/utils/chart-keys";
import {
  GROUNDED_SUFFIX_PATTERN,
  isGroundedEngine,
} from "@/utils/geo-presence";

const PERCENT = 100;

const SHARE_TOP_BRANDS = 5;

export function buildShareOfVoiceRows(
  points: readonly GeoCompetitorSharePoint[]
): ShareOfVoiceRow[] {
  const top = points.slice(0, SHARE_TOP_BRANDS);
  const rest = points.slice(SHARE_TOP_BRANDS);
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

const MIN_BAR_PERCENT = 2;

export function barWidthPercent(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  return Math.max((value / max) * PERCENT, MIN_BAR_PERCENT);
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

export function latestChartDay(lastKnownDay: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return lastKnownDay > today ? lastKnownDay : today;
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

  const knownDays = [...byDay.keys()].sort();
  const firstDay = knownDays.at(0);
  const lastDay = knownDays.at(-1);
  const days =
    firstDay && lastDay
      ? listDaysThrough(firstDay, latestChartDay(lastDay))
      : knownDays;
  const rows = days.map((day) => {
    const row: MentionRateRow = { day: formatDayLabel(day), rawDay: day };
    const dayPoints = byDay.get(day);
    for (const engine of engines) {
      const point = dayPoints?.get(engine);
      row[chartKey(engine)] =
        point && point.checks > 0
          ? Math.round((point.mentions / point.checks) * PERCENT)
          : 0;
    }
    return row;
  });

  return { rows, engines };
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
      ? Math.round((groundedRate - rawRate) * PERCENT)
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
    return "Run scans with and without web search to measure your grounding gap.";
  }
  if (gapPoints > 0) {
    return `Engines mention you ${gapPoints} points more often with web search than from memory alone: your visibility lives in retrieval, not training data.`;
  }
  if (gapPoints < 0) {
    return `Engines mention you ${Math.abs(gapPoints)} points more often from memory than with web search: you are already part of the training data.`;
  }
  return "Engines mention you as often from memory as with web search: your visibility is evenly grounded.";
}

const WEB_LABEL_SUFFIX_PATTERN = /\s*\(web\)$/;

export function engineFamilyOf(engine: string): string {
  return engine.replace(GROUNDED_SUFFIX_PATTERN, "");
}

export function engineFamilyLabel(family: string): string {
  const label =
    GEO_ENGINE_LABELS[family] ?? GEO_ENGINE_LABELS[`${family}-grounded`];
  if (!label) {
    return family;
  }
  return label.replace(WEB_LABEL_SUFFIX_PATTERN, "");
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
