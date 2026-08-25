"use client";

import { useId, useMemo, useState } from "react";
import { EChartsBarChart } from "@/components/evilcharts/charts/echarts-bar-chart";
import { buildChartCss } from "@/components/evilcharts/ui/echarts-chart";
import { EngineIcon, engineIconHtml } from "@/components/geo/engine-icon";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { GEO_MODEL_USAGE_CHART_HEIGHT_CLASS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/types/charts";
import type { ModelUsageCardProps, ModelUsageLegendProps } from "@/types/geo";
import { formatMetric } from "@/utils/analytics-charts";
import { modelUsageSeriesColors } from "@/utils/chart-colors";
import { formatUsageShare } from "@/utils/geo-charts";
import { buildModelUsageChart } from "@/utils/geo-model-usage";

function ModelUsageLegend({
  series,
  config,
  hoveredKey,
  onHoverKeyChange,
}: ModelUsageLegendProps) {
  const rawId = useId();
  const legendId = `model-usage-legend-${rawId.replace(/:/g, "")}`;
  const css = useMemo(
    () => buildChartCss(legendId, config),
    [legendId, config]
  );

  return (
    <ul
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3"
      data-chart={legendId}
    >
      <style>{css}</style>
      {series.map((entry) => (
        <li key={entry.key}>
          <button
            className={cn(
              "flex min-w-0 cursor-pointer items-center gap-1.5 bg-transparent p-0 text-left text-muted-foreground text-xs transition-opacity",
              hoveredKey !== null && hoveredKey !== entry.key && "opacity-30"
            )}
            onBlur={() => onHoverKeyChange(null)}
            onFocus={() => onHoverKeyChange(entry.key)}
            onMouseEnter={() => onHoverKeyChange(entry.key)}
            onMouseLeave={() => onHoverKeyChange(null)}
            type="button"
          >
            <span
              className="size-2 shrink-0 rounded-[0.0625rem]"
              style={{ backgroundColor: `var(--color-${entry.key}-0)` }}
            />
            <EngineIcon className="size-3.5" engine={entry.model} />
            <span className="truncate">{entry.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ModelUsageCard({ usage }: ModelUsageCardProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const chart = useMemo(
    () =>
      buildModelUsageChart(
        usage?.models ?? [],
        usage?.points ?? [],
        usage?.capturedAt ?? null
      ),
    [usage]
  );
  const config = useMemo(() => {
    const chartConfig: ChartConfig = {};
    for (const [index, entry] of chart.series.entries()) {
      chartConfig[entry.key] = {
        label: entry.label,
        colors: modelUsageSeriesColors(index),
        indicatorHtml: engineIconHtml(entry.model),
      };
    }
    return chartConfig;
  }, [chart.series]);
  const valueFormatter =
    chart.metric === "tokens" ? formatMetric : formatUsageShare;

  return (
    <InstrumentSection
      description={
        chart.rows.length > 0 ? "Weekly tokens on OpenRouter" : undefined
      }
      eyebrow="Where AI usage actually happens"
    >
      {chart.rows.length === 0 ? (
        <InstrumentEmpty
          className={GEO_MODEL_USAGE_CHART_HEIGHT_CLASS}
          message="Model usage data is currently unavailable"
          seed="Where AI usage actually happens"
        />
      ) : (
        <div>
          <EChartsBarChart
            animation={false}
            barRadius={0}
            className={cn("w-full", GEO_MODEL_USAGE_CHART_HEIGHT_CLASS)}
            config={config}
            data={chart.rows}
            stackType={chart.metric === "share" ? "percent" : "stacked"}
            xDataKey="week"
          >
            <EChartsBarChart.Grid />
            <EChartsBarChart.XAxis dataKey="week" />
            <EChartsBarChart.YAxis
              tickFormatter={
                chart.metric === "tokens"
                  ? (value) => formatMetric(Number(value))
                  : undefined
              }
            />
            {chart.series.map((entry) => (
              <EChartsBarChart.Bar dataKey={entry.key} key={entry.key} />
            ))}
            <EChartsBarChart.Tooltip
              layout="bars"
              pointer="shadow"
              valueFormatter={valueFormatter}
            />
          </EChartsBarChart>
          <ModelUsageLegend
            config={config}
            hoveredKey={hoveredKey}
            onHoverKeyChange={setHoveredKey}
            series={chart.series}
          />
        </div>
      )}
    </InstrumentSection>
  );
}
