"use client";

import { useMemo } from "react";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";
import {
  SPARKLINE_CHART_OPTIONS,
  SPARKLINE_SERIES_KEY,
} from "@/constants/charts";
import type { ChartSparklineProps } from "@/types/charts";
import { seriesColors } from "@/utils/chart-colors";

export function ChartSparkline({
  data,
  color,
  className,
  markIncompleteTail = true,
}: ChartSparklineProps) {
  const rows = useMemo(
    () =>
      data.map((value, index) => ({
        point: String(index),
        [SPARKLINE_SERIES_KEY]: value,
      })),
    [data]
  );

  const config = useMemo<ChartConfig>(
    () => ({ [SPARKLINE_SERIES_KEY]: { colors: seriesColors(color) } }),
    [color]
  );

  return (
    <EChartsAreaChart
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
    </EChartsAreaChart>
  );
}
