"use client";

import { ChartColorScope } from "@/components/charts/chart-color-scope";
import { EChartsPieChart } from "@/components/evilcharts/charts/echarts-pie-chart";
import { DONUT_INNER_RADIUS, DONUT_OUTER_RADIUS } from "@/constants/charts";
import {
  GEO_DIRECTIONS_SHARE,
  GEO_DIRECTIONS_SHARE_CONFIG,
  GEO_DIRECTIONS_SHARE_SLICES,
} from "@/constants/geo-directions";
import { cn } from "@/lib/utils";
import type { DirectionDonutProps } from "@/types/geo-directions";
import { formatMentionRate } from "@/utils/geo-charts";
import { directionShareOf } from "@/utils/geo-directions";

const SHARE_TOTAL = GEO_DIRECTIONS_SHARE.reduce(
  (sum, point) => sum + point.mentions,
  0
);

export function DirectionDonut({
  className,
  legendClassName,
}: DirectionDonutProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <EChartsPieChart
        animation={false}
        className="h-48 w-1/2 min-w-0"
        config={GEO_DIRECTIONS_SHARE_CONFIG}
        data={GEO_DIRECTIONS_SHARE_SLICES}
        dataKey="mentions"
        nameKey="slice"
      >
        <EChartsPieChart.Pie
          innerRadius={DONUT_INNER_RADIUS}
          outerRadius={DONUT_OUTER_RADIUS}
        />
        <EChartsPieChart.Tooltip
          barMax={SHARE_TOTAL}
          layout="bars"
          valueFormatter={(mentions) =>
            formatMentionRate(SHARE_TOTAL > 0 ? mentions / SHARE_TOTAL : 0)
          }
        />
      </EChartsPieChart>
      <ChartColorScope
        className={cn("min-w-0 flex-1 space-y-1.5", legendClassName)}
        config={GEO_DIRECTIONS_SHARE_CONFIG}
      >
        {GEO_DIRECTIONS_SHARE_SLICES.map((row) => (
          <div className="flex items-center gap-1.5 text-xs" key={row.slice}>
            <span
              className="size-2 shrink-0 rounded-[0.0625rem]"
              style={{ backgroundColor: `var(--color-${row.slice}-0)` }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {row.brand}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatMentionRate(directionShareOf(row, GEO_DIRECTIONS_SHARE))}
            </span>
          </div>
        ))}
      </ChartColorScope>
    </div>
  );
}
