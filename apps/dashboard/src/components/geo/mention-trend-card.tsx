"use client";

import { useCallback, useMemo, useState } from "react";
import { EmptyStateTrendPreview } from "@/components/empty-state-preview";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { engineIconHtml } from "@/components/geo/engine-icon";
import { MentionTrendAgentsPicker } from "@/components/geo/mention-trend-agents";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { CHART_MUTED_COLOR } from "@/constants/charts";
import {
  GEO_MENTION_TREND_AVERAGE_KEY,
  GEO_MENTION_TREND_AVERAGE_LABEL,
} from "@/constants/geo";
import type { ChartConfig } from "@/types/charts";
import type {
  MentionTrendCardProps,
  MentionTrendRow,
  MentionTrendSeries,
} from "@/types/geo";
import { todayIsoDate } from "@/utils/analytics-charts";
import { accountSeriesColors, seriesColors } from "@/utils/chart-colors";
import { chartKey } from "@/utils/chart-keys";
import {
  buildMentionTrendRows,
  fitMentionTrendAverage,
  formatChartInteger,
  formatEngineFamily,
  mentionTrendEmptyLabel,
} from "@/utils/geo-charts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

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

export function MentionTrendCard({
  points,
  isScanning = false,
}: MentionTrendCardProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set());

  const { rows, engines } = useMemo(
    () => buildMentionTrendRows(points),
    [points]
  );
  const series = useMemo(() => mentionTrendSeries(engines), [engines]);
  const allKeys = useMemo(() => series.map((entry) => entry.key), [series]);
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
    for (const [index, entry] of series.entries()) {
      trendConfig[entry.key] = {
        label: entry.label,
        colors: accountSeriesColors(index),
        indicatorHtml: engineIconHtml(entry.engine),
      };
    }
    return trendConfig;
  }, [series]);
  const markIncompleteTail = hasIncompleteTail(rows);
  const sampledDays = sampledDayCount(rows, engines);

  const handleToggle = useCallback(
    (key: string) => {
      setHiddenKeys((previous) => toggleHiddenSeries(previous, key, allKeys));
    },
    [allKeys]
  );

  const emptyMessage =
    sampledDays === 0 || visibleSeries.length === 0
      ? geoScanEmptyMessage(isScanning, "Run a scan to see your mention trend")
      : null;

  return (
    <InstrumentSection
      action={
        <MentionTrendAgentsPicker
          disabled={emptyMessage !== null}
          hiddenKeys={effectiveHiddenKeys}
          onToggle={handleToggle}
          series={series}
        />
      }
      bodyClassName="flex flex-col"
      eyebrow="Mention trend"
    >
      {emptyMessage ? (
        <InstrumentEmpty
          busy={isScanning}
          className="h-80"
          message={emptyMessage}
          preview={<EmptyStateTrendPreview />}
          seed="Mention trend"
        />
      ) : (
        <EChartsAreaChart
          animation={false}
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
            confine={false}
            emptyLabel={(row) => mentionTrendEmptyLabel(row, visibleKeys)}
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
