"use client";

import { Children, isValidElement, type ReactNode, useMemo } from "react";
import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import {
  SPARKLINE_CHART_OPTIONS,
  SPARKLINE_SERIES_KEY,
} from "@/constants/charts";
import type {
  ChartConfig,
  ChartSparklineProps,
  ChartSparklineTooltipProps,
} from "@/types/charts";
import { seriesColors } from "@/utils/chart-colors";

function SparklineTooltip(_props: ChartSparklineTooltipProps) {
  return null;
}

function sparklineTooltipProps(
  children: ReactNode
): ChartSparklineTooltipProps | null {
  let found: ChartSparklineTooltipProps | null = null;
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === SparklineTooltip) {
      found = child.props as ChartSparklineTooltipProps;
    }
  });
  return found;
}

export function ChartSparkline({
  data,
  labels,
  color,
  className,
  markIncompleteTail = true,
  children,
}: ChartSparklineProps) {
  const tooltip = sparklineTooltipProps(children);
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
        label: tooltip?.seriesLabel ?? "",
        colors: seriesColors(color),
      },
    }),
    [color, tooltip?.seriesLabel]
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
      {tooltip ? (
        <EChartsAreaChart.Tooltip
          confine={false}
          roundness="xl"
          valueFormatter={tooltip.valueFormatter}
        />
      ) : null}
    </EChartsAreaChart>
  );
}

ChartSparkline.Tooltip = SparklineTooltip;
