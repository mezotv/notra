"use client";

import { Bar } from "@notra/ui/components/dither-kit/bar";
import { BarChart } from "@notra/ui/components/dither-kit/bar-chart";
import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { Grid } from "@notra/ui/components/dither-kit/grid";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import { XAxis } from "@notra/ui/components/dither-kit/x-axis";
import { YAxis } from "@notra/ui/components/dither-kit/y-axis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useState } from "react";
import { ChartSeriesLegend } from "@/components/analytics/chart-legend";
import type { PostingPerformanceChartRow } from "@/types/analytics";

interface PostingPerformanceCardProps {
  rows: PostingPerformanceChartRow[];
}

const chartConfig: ChartConfig = {
  avgEngagement: { label: "Avg engagement", color: "green" },
  posts: { label: "Posts", color: "grey" },
};

const seriesKeys = Object.keys(chartConfig);

export function PostingPerformanceCard({ rows }: PostingPerformanceCardProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const visibleKeys = seriesKeys.filter((key) => !hiddenKeys.has(key));
  const hasData = rows.some((row) => row.posts > 0);

  const toggle = (key: string) => {
    setHiddenKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best days to post</CardTitle>
        <CardDescription>
          Average engagement per post and post volume by weekday, last 90 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData && visibleKeys.length > 0 ? (
          <BarChart className="h-56 w-full" config={chartConfig} data={rows}>
            <Grid />
            <XAxis dataKey="day" />
            <YAxis />
            {visibleKeys.map((key) => (
              <Bar dataKey={key} key={key} />
            ))}
            <Tooltip labelKey="day" />
          </BarChart>
        ) : (
          <p className="flex h-56 items-center justify-center text-muted-foreground text-sm">
            No posting data yet
          </p>
        )}
        <ChartSeriesLegend
          config={chartConfig}
          hiddenKeys={hiddenKeys}
          onToggle={toggle}
          orderedKeys={seriesKeys}
        />
      </CardContent>
    </Card>
  );
}
