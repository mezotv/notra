"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import { ChartColorScope } from "@/components/charts/chart-color-scope";
import { EChartsPieChart } from "@/components/evilcharts/charts/echarts-pie-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { DONUT_INNER_RADIUS, DONUT_OUTER_RADIUS } from "@/constants/charts";
import type {
  CompetitorShareCardProps,
  GeoCompetitorSharePieSlice,
} from "@/types/geo";
import { chartKey } from "@/utils/chart-keys";
import { formatMentionRate } from "@/utils/geo-charts";
import { buildCompetitorShareRows } from "@/utils/geo-competitors";

export function CompetitorShareCard({
  points,
  companyName,
  competitors,
}: CompetitorShareCardProps) {
  const { slices, config, total } = useMemo(() => {
    const mentioned = buildCompetitorShareRows(points, competitors).filter(
      (row) => row.mentions > 0
    );
    const sliceRows: GeoCompetitorSharePieSlice[] = mentioned.map((row) => ({
      ...row,
      slice: chartKey(row.brand),
    }));
    const sliceConfig: ChartConfig = {};
    for (const row of sliceRows) {
      sliceConfig[row.slice] = {
        label: row.brand,
        colors: { light: [row.color], dark: [row.color] },
      };
    }
    return {
      slices: sliceRows,
      config: sliceConfig,
      total: sliceRows.reduce((sum, row) => sum + row.mentions, 0),
    };
  }, [points, competitors]);

  return (
    <Card className="overflow-visible rounded-2xl bg-transparent p-0 ring-0">
      <CardHeader className="rounded-t-2xl border border-border border-b-0 bg-muted pt-4 pb-9">
        <CardTitle>Share of voice</CardTitle>
        <CardDescription>
          Brands AI engines bring up
          {companyName ? ` alongside ${companyName}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="-mt-9 relative rounded-2xl border border-border bg-card pt-6 pb-6">
        {slices.length === 0 ? (
          <p className="flex h-40 items-center justify-center text-muted-foreground text-sm">
            No competitor data yet
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <EChartsPieChart
              className="h-64 w-full min-w-0 sm:w-1/2"
              config={config}
              data={slices}
              dataKey="mentions"
              nameKey="slice"
            >
              <EChartsPieChart.Pie
                innerRadius={DONUT_INNER_RADIUS}
                outerRadius={DONUT_OUTER_RADIUS}
              />
              <EChartsPieChart.Tooltip />
            </EChartsPieChart>
            <ChartColorScope
              className="min-w-0 flex-1 space-y-2 self-center"
              config={config}
            >
              {slices.map((row) => (
                <div
                  className="flex items-center gap-2 text-sm"
                  key={row.slice}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[0.125rem]"
                    style={{ backgroundColor: row.color }}
                  />
                  <CompetitorLogo
                    className="size-4"
                    domain={row.domain}
                    name={row.brand}
                  />
                  <span className="min-w-0 flex-1 truncate">{row.brand}</span>
                  <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                    {row.mentions.toLocaleString()}
                  </span>
                  <span className="w-10 shrink-0 text-right tabular-nums">
                    {total > 0 ? formatMentionRate(row.mentions / total) : "0%"}
                  </span>
                </div>
              ))}
            </ChartColorScope>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
