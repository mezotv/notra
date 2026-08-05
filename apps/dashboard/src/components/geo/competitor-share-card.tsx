"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { EChartsBarChart } from "@/components/evilcharts/charts/echarts-bar-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { CHART_PRIMARY_COLOR } from "@/constants/charts";
import { findCompetitorDomain } from "@/lib/geo/domain";
import type { CompetitorShareCardProps } from "@/types/geo";
import { seriesColors } from "@/utils/chart-colors";

const chartConfig: ChartConfig = {
  mentions: { label: "Mentions", colors: seriesColors(CHART_PRIMARY_COLOR) },
};

export function CompetitorShareCard({
  points,
  companyName,
  competitors,
}: CompetitorShareCardProps) {
  const rows = points.map((point) => ({
    brand: point.brand,
    mentions: point.mentions,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share of voice</CardTitle>
        <CardDescription>
          Brands AI engines bring up
          {companyName ? ` alongside ${companyName}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="flex h-56 items-center justify-center text-muted-foreground text-sm">
            No competitor data yet
          </p>
        ) : (
          <div className="space-y-4">
            <EChartsBarChart
              className="h-56 w-full"
              config={chartConfig}
              data={rows}
              xDataKey="brand"
            >
              <EChartsBarChart.Grid />
              <EChartsBarChart.XAxis dataKey="brand" />
              <EChartsBarChart.YAxis />
              <EChartsBarChart.Bar dataKey="mentions" />
              <EChartsBarChart.Tooltip />
            </EChartsBarChart>
            <ul className="space-y-1.5">
              {rows.map((row) => (
                <li className="flex items-center gap-2 text-xs" key={row.brand}>
                  <CompetitorLogo
                    domain={findCompetitorDomain(competitors, row.brand)}
                    name={row.brand}
                  />
                  <span className="min-w-0 flex-1 truncate">{row.brand}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {row.mentions}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
