"use client";

import { useCallback, useMemo, useState } from "react";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { engineIconHtml } from "@/components/geo/engine-icon";
import { MentionTrendAgentsPicker } from "@/components/geo/mention-trend-agents";
import { MentionTrendRangePicker } from "@/components/geo/mention-trend-range";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { CHART_MUTED_COLOR } from "@/constants/charts";
import {
  GEO_MENTION_TREND_AVERAGE_KEY,
  GEO_MENTION_TREND_AVERAGE_LABEL,
  GEO_MENTION_TREND_DEFAULT_RANGE,
  GEO_MENTION_TREND_RANGE_DAYS,
  GEO_TREND_MIN_DAYS,
} from "@/constants/geo";
import type { ChartConfig } from "@/types/charts";
import type {
  GeoMentionTrendRange,
  MentionTrendCardProps,
  MentionTrendRow,
  MentionTrendSeries,
} from "@/types/geo";
import { todayIsoDate } from "@/utils/analytics-charts";
import { accountSeriesColors, seriesColors } from "@/utils/chart-colors";
import { chartKey } from "@/utils/chart-keys";
import {
  buildMentionTrendRows,
  filterTimeseriesByDays,
  fitMentionTrendAverage,
  formatChartInteger,
  formatEngineFamily,
} from "@/utils/geo-charts";

const ENGINE_STROKE_WIDTH = 1.5;
const AVERAGE_STROKE_WIDTH = 2;

function mentionTrendSeries(engines: readonly string[]): MentionTrendSeries[] {
  return engines.map((engine) => ({
    key: chartKey(engine),
    engine,
    label: formatEngineFamily(engine),
  }));
}

function sampledDayCount(
  rows: readonly MentionTrendRow[],
  engines: readonly string[]
): number {
  return rows.filter((row) =>
    engines.some((engine) => typeof row[chartKey(engine)] === "number")
  ).length;
}

function hasIncompleteTail(rows: readonly MentionTrendRow[]): boolean {
  const last = rows.at(-1);
  if (!last) {
    return false;
  }
  return last.rawDay === todayIsoDate();
}

function toggleHiddenSeries(
  hiddenKeys: ReadonlySet<string>,
  key: string,
  allKeys: readonly string[]
): Set<string> {
  const next = new Set(hiddenKeys);
  if (next.has(key)) {
    next.delete(key);
    return next;
  }
  const visibleCount = allKeys.filter((item) => !next.has(item)).length;
  if (visibleCount <= 1) {
    return next;
  }
  next.add(key);
  return next;
}

export function MentionTrendCard({ points }: MentionTrendCardProps) {
  const [range, setRange] = useState<GeoMentionTrendRange>(
    GEO_MENTION_TREND_DEFAULT_RANGE
  );
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set());
  const rangeDays = GEO_MENTION_TREND_RANGE_DAYS[range];

  const fullTrend = useMemo(() => buildMentionTrendRows(points), [points]);
  const windowedPoints = useMemo(
    () => filterTimeseriesByDays(points, rangeDays),
    [points, rangeDays]
  );
  const { rows, engines } = useMemo(
    () => buildMentionTrendRows(windowedPoints),
    [windowedPoints]
  );
  const pickerSeries = useMemo(
    () => mentionTrendSeries(fullTrend.engines),
    [fullTrend.engines]
  );
  const series = useMemo(() => mentionTrendSeries(engines), [engines]);
  const allKeys = useMemo(
    () => pickerSeries.map((entry) => entry.key),
    [pickerSeries]
  );
  const effectiveHiddenKeys = useMemo(() => {
    const current = new Set(allKeys);
    const hidden = new Set([...hiddenKeys].filter((key) => current.has(key)));
    if (allKeys.length > 0 && hidden.size >= allKeys.length) {
      return new Set<string>();
    }
    return hidden;
  }, [allKeys, hiddenKeys]);
  const visibleSeries = useMemo(
    () => series.filter((entry) => !effectiveHiddenKeys.has(entry.key)),
    [series, effectiveHiddenKeys]
  );
  const visibleKeys = useMemo(
    () => visibleSeries.map((entry) => entry.key),
    [visibleSeries]
  );
  const chartRows = useMemo(() => {
    const averages = fitMentionTrendAverage(rows, visibleKeys);
    return rows.map((row, index) => ({
      ...row,
      [GEO_MENTION_TREND_AVERAGE_KEY]: averages[index] ?? null,
    }));
  }, [rows, visibleKeys]);
  const config = useMemo(() => {
    const trendConfig: ChartConfig = {
      [GEO_MENTION_TREND_AVERAGE_KEY]: {
        label: GEO_MENTION_TREND_AVERAGE_LABEL,
        colors: seriesColors(CHART_MUTED_COLOR),
      },
    };
    for (const [index, entry] of pickerSeries.entries()) {
      trendConfig[entry.key] = {
        label: entry.label,
        colors: accountSeriesColors(index),
        indicatorHtml: engineIconHtml(entry.engine),
      };
    }
    return trendConfig;
  }, [pickerSeries]);
  const markIncompleteTail = hasIncompleteTail(rows);
  const fullSampledDays = sampledDayCount(fullTrend.rows, fullTrend.engines);
  const windowSampledDays = sampledDayCount(rows, engines);

  const handleToggle = useCallback(
    (key: string) => {
      setHiddenKeys((previous) => toggleHiddenSeries(previous, key, allKeys));
    },
    [allKeys]
  );

  let emptyMessage: string | null = null;
  if (fullSampledDays < GEO_TREND_MIN_DAYS) {
    emptyMessage = `Trend appears after ${GEO_TREND_MIN_DAYS} days of scans`;
  } else if (windowSampledDays === 0 || visibleSeries.length === 0) {
    emptyMessage = "No mention data in this range";
  }

  return (
    <InstrumentSection
      action={
        <div className="flex items-center gap-1.5">
          <MentionTrendRangePicker onChange={setRange} value={range} />
          <MentionTrendAgentsPicker
            disabled={emptyMessage !== null}
            hiddenKeys={effectiveHiddenKeys}
            onToggle={handleToggle}
            series={pickerSeries}
          />
        </div>
      }
      bodyClassName="flex flex-col"
      eyebrow="Mention trend"
    >
      {emptyMessage ? (
        <InstrumentEmpty
          className="h-80"
          message={emptyMessage}
          seed="Mention trend"
        />
      ) : (
        <EChartsAreaChart
          className="h-80 w-full"
          config={config}
          curveType="monotone"
          data={chartRows}
          xDataKey="day"
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="day" />
          <EChartsAreaChart.YAxis />
          {visibleSeries.map((entry) => (
            <EChartsAreaChart.Area
              dataKey={entry.key}
              enableBufferLine={markIncompleteTail}
              key={entry.key}
              strokeVariant="solid"
              strokeWidth={ENGINE_STROKE_WIDTH}
              variant="gradient"
            >
              <EChartsAreaChart.ActiveDot variant="border" />
            </EChartsAreaChart.Area>
          ))}
          <EChartsAreaChart.Area
            curveType="linear"
            dataKey={GEO_MENTION_TREND_AVERAGE_KEY}
            strokeVariant="dashed"
            strokeWidth={AVERAGE_STROKE_WIDTH}
            variant="none"
          />
          <EChartsAreaChart.Tooltip
            hideZeros
            layout="bars"
            position="fixed"
            rowKeys={visibleKeys}
            valueFormatter={formatChartInteger}
          />
        </EChartsAreaChart>
      )}
    </InstrumentSection>
  );
}
