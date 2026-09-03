"use client";

import {
  GEO_COMPETITOR_DETAIL_CHART_HEIGHT_CLASS,
  GEO_COMPETITOR_DETAIL_SERIES_KEY,
} from "@notra/geo-core/constants/geo";

import { EChartsBarChart } from "@/components/evilcharts/charts/echarts-bar-chart";
import { CHART_PRIMARY_COLOR } from "@/constants/charts";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/types/charts";
import type { CompetitorMentionsChartProps } from "@/types/geo";
import { seriesColors } from "@/utils/chart-colors";

const CHART_CONFIG: ChartConfig = {
  [GEO_COMPETITOR_DETAIL_SERIES_KEY]: {
    label: "Mentions",
    colors: seriesColors(CHART_PRIMARY_COLOR),
  },
};

export function CompetitorMentionsChart({
  competitor,
  incompleteTail,
  points,
}: CompetitorMentionsChartProps) {
  return (
    <EChartsBarChart
      animation={false}
      className={cn("w-full", GEO_COMPETITOR_DETAIL_CHART_HEIGHT_CLASS)}
      config={CHART_CONFIG}
      data={points}
      key={competitor}
      xDataKey="day"
    >
      <EChartsBarChart.Grid />
      <EChartsBarChart.XAxis dataKey="day" />
      <EChartsBarChart.YAxis />
      <EChartsBarChart.Bar
        bufferBar={incompleteTail}
        dataKey={GEO_COMPETITOR_DETAIL_SERIES_KEY}
      />
      <EChartsBarChart.Tooltip />
    </EChartsBarChart>
  );
}
