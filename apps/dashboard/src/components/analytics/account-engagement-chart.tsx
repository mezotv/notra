"use client";

import { EChartsAreaChart } from "@/components/evilcharts/charts/echarts-area-chart";
import { ACCOUNT_DETAIL_SERIES_KEY } from "@/constants/analytics";
import { CHART_PRIMARY_COLOR } from "@/constants/charts";
import type { AccountEngagementChartProps } from "@/types/analytics";
import type { ChartConfig } from "@/types/charts";
import { seriesColors } from "@/utils/chart-colors";

const CHART_CONFIG: ChartConfig = {
  [ACCOUNT_DETAIL_SERIES_KEY]: {
    label: "Engagement",
    colors: seriesColors(CHART_PRIMARY_COLOR),
  },
};

export function AccountEngagementChart({
  points,
}: AccountEngagementChartProps) {
  return (
    <EChartsAreaChart
      className="h-52 w-full"
      config={CHART_CONFIG}
      curveType="monotone"
      data={points}
      enableHoverHighlight
      xDataKey="day"
    >
      <EChartsAreaChart.Grid />
      <EChartsAreaChart.XAxis dataKey="day" />
      <EChartsAreaChart.YAxis />
      <EChartsAreaChart.Area
        dataKey={ACCOUNT_DETAIL_SERIES_KEY}
        variant="gradient"
      />
      <EChartsAreaChart.Tooltip crosshair />
    </EChartsAreaChart>
  );
}
