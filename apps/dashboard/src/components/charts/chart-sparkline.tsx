"use client";

import { useMemo } from "react";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { tooltipColorSwatchHtml } from "@/components/evilcharts/ui/echarts-tooltip";
import {
  SPARKLINE_CHART_OPTIONS,
  SPARKLINE_SERIES_KEY,
} from "@/constants/charts";
import type { ChartConfig, ChartSparklineProps } from "@/types/charts";
import { seriesColors } from "@/utils/chart-colors";

export function ChartSparkline({
  data,
  labels,
  color,
  className,
  markIncompleteTail = true,
  tooltipValueFormatter,
}: ChartSparklineProps) {
  const rows = useMemo(
    () =>
      data.map((value, index) => ({
        point: labels?.[index] ?? String(index),
        [SPARKLINE_SERIES_KEY]: value,
      })),
    [data, labels]
  );

  const config = useMemo<ChartConfig>(
    () => ({
      [SPARKLINE_SERIES_KEY]: {
        label: "",
        colors: seriesColors(color),
        // Body-mounted tooltip is outside [data-chart], so CSS series vars
        // would not resolve — paint the swatch with the series hex instead.
        indicatorHtml: tooltipColorSwatchHtml(color.light),
      },
    }),
    [color]
  );

  return (
    <EChartsAreaChart
      animation={false}
      chartOptions={SPARKLINE_CHART_OPTIONS}
      className={className}
      config={config}
      curveType="monotone"
      data={rows}
      xDataKey="point"
    >
      <EChartsAreaChart.Area
        dataKey={SPARKLINE_SERIES_KEY}
        enableBufferLine={markIncompleteTail}
        strokeVariant="solid"
        variant="gradient"
      />
      {tooltipValueFormatter ? (
        <EChartsAreaChart.Tooltip
          confine={false}
          cursor={false}
          valueFormatter={tooltipValueFormatter}
        />
      ) : null}
    </EChartsAreaChart>
  );
}
