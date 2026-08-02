"use client";

import { Bar } from "@notra/ui/components/dither-kit/bar";
import { BarChart } from "@notra/ui/components/dither-kit/bar-chart";
import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { Grid } from "@notra/ui/components/dither-kit/grid";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import { XAxis } from "@notra/ui/components/dither-kit/x-axis";
import { YAxis } from "@notra/ui/components/dither-kit/y-axis";
import { useState } from "react";
import { ChartSeriesLegend } from "@/components/analytics/chart-legend";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
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
    <InstrumentModule eyebrow="Best days to post" readout="90D">
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
        <InstrumentEmpty
          className="h-56"
          message="No posting data yet"
          seed="Best days to post"
        />
      )}
      <ChartSeriesLegend
        config={chartConfig}
        hiddenKeys={hiddenKeys}
        onToggle={toggle}
        orderedKeys={seriesKeys}
      />
    </InstrumentModule>
  );
}
