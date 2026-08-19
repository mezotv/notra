"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { EChartsLineChart } from "@/components/evilcharts/charts/echarts-line-chart";
import { buildChartCss } from "@/components/evilcharts/ui/echarts-chart";
import { EngineIcon, engineIconHtml } from "@/components/geo/engine-icon";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { CHART_PERCENT_SCALE } from "@/constants/charts";
import { GEO_TREND_MIN_DAYS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/types/charts";
import type {
  MentionRateRow,
  MentionTrendCardProps,
  MentionTrendLegendProps,
  MentionTrendSeries,
} from "@/types/geo";
import { accountSeriesColors } from "@/utils/chart-colors";
import { chartKey } from "@/utils/chart-keys";
import {
  buildMentionRateRows,
  engineFamilyLabel,
  formatChartPercent,
} from "@/utils/geo-charts";

function sampledDayCount(
  rows: readonly MentionRateRow[],
  engines: readonly string[]
): number {
  return rows.filter((row) =>
    engines.some((engine) => typeof row[chartKey(engine)] === "number")
  ).length;
}

function hasIncompleteTail(rows: readonly MentionRateRow[]): boolean {
  const last = rows.at(-1);
  if (!last) {
    return false;
  }
  return last.rawDay === new Date().toISOString().slice(0, 10);
}

function MentionTrendLegend({
  series,
  config,
  hiddenKeys,
  onToggle,
}: MentionTrendLegendProps) {
  const rawId = useId();
  const legendId = `legend-${rawId.replace(/:/g, "")}`;
  const css = useMemo(
    () => buildChartCss(legendId, config),
    [legendId, config]
  );

  return (
    <div
      className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
      data-chart={legendId}
    >
      <style>{css}</style>
      {series.map((entry) => {
        const hidden = hiddenKeys.has(entry.key);
        return (
          <button
            aria-pressed={!hidden}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 text-[0.6875rem] transition-opacity",
              hidden
                ? "opacity-40 hover:opacity-70"
                : "text-muted-foreground hover:text-foreground"
            )}
            key={entry.key}
            onClick={() => onToggle(entry.key)}
            type="button"
          >
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                hidden && "opacity-50"
              )}
              style={{ backgroundColor: `var(--color-${entry.key}-0)` }}
            />
            <EngineIcon className="size-3.5" engine={entry.engine} />
            <span className={cn(hidden && "line-through")}>{entry.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MentionTrendCard({ points }: MentionTrendCardProps) {
  const { rows, engines } = useMemo(
    () => buildMentionRateRows(points),
    [points]
  );
  const series = useMemo<MentionTrendSeries[]>(
    () =>
      engines.map((engine) => ({
        key: chartKey(engine),
        engine,
        label: engineFamilyLabel(engine),
      })),
    [engines]
  );
  const config = useMemo(() => {
    const trendConfig: ChartConfig = {};
    for (const [index, entry] of series.entries()) {
      trendConfig[entry.key] = {
        label: entry.label,
        colors: accountSeriesColors(index),
        indicatorHtml: engineIconHtml(entry.engine),
      };
    }
    return trendConfig;
  }, [series]);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set());
  const visibleSeries = series.filter((entry) => !hiddenKeys.has(entry.key));
  const toggleSeries = useCallback(
    (key: string) => {
      setHiddenKeys((current) => {
        const next = new Set(current);
        if (next.has(key)) {
          next.delete(key);
          return next;
        }
        if (series.length - next.size <= 1) {
          return current;
        }
        next.add(key);
        return next;
      });
    },
    [series.length]
  );
  const markIncompleteTail = hasIncompleteTail(rows);

  return (
    <InstrumentModule eyebrow="Mention rate trend">
      {sampledDayCount(rows, engines) < GEO_TREND_MIN_DAYS ? (
        <InstrumentEmpty
          className="h-64"
          message={`Trend appears after ${GEO_TREND_MIN_DAYS} days of scans`}
          seed="Mention rate trend"
        />
      ) : (
        <>
          <EChartsLineChart
            className="h-64 w-full"
            config={config}
            curveType="linear"
            data={rows}
            enableHoverHighlight
            xDataKey="day"
          >
            <EChartsLineChart.Grid />
            <EChartsLineChart.XAxis dataKey="day" />
            <EChartsLineChart.YAxis tickFormatter={formatChartPercent} />
            {visibleSeries.map((entry) => (
              <EChartsLineChart.Line
                dataKey={entry.key}
                enableBufferLine={markIncompleteTail}
                isClickable
                key={entry.key}
                strokeVariant="solid"
              >
                <EChartsLineChart.ActiveDot variant="ping" />
              </EChartsLineChart.Line>
            ))}
            <EChartsLineChart.Tooltip
              barMax={CHART_PERCENT_SCALE}
              crosshair
              layout="bars"
              valueFormatter={formatChartPercent}
            />
          </EChartsLineChart>
          <MentionTrendLegend
            config={config}
            hiddenKeys={hiddenKeys}
            onToggle={toggleSeries}
            series={series}
          />
        </>
      )}
    </InstrumentModule>
  );
}
