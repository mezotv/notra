"use client";

import { Area, Line } from "@notra/ui/components/dither-kit/area";
import {
  AreaChart,
  LineChart,
} from "@notra/ui/components/dither-kit/area-chart";
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
import { ChartSeriesLegend } from "@/components/analytics/chart-legend";
import { VerticalMarker } from "@/components/analytics/chart-marker";
import type { AccountSeriesRow, TimelineMarker } from "@/types/analytics";

interface AccountSeriesChartCardProps {
  title: string;
  description: string;
  kind: "area" | "line" | "bar";
  rows: AccountSeriesRow[];
  config: ChartConfig;
  allKeys: string[];
  hiddenKeys: ReadonlySet<string>;
  onToggleSeries: (key: string) => void;
  hoverIndex: number | null;
  onHoverChange: (index: number | null) => void;
  markers: TimelineMarker[];
  emptyMessage: string;
}

const CHART_CLASS = "h-56 w-full";

function chartFor(kind: "area" | "line" | "bar") {
  if (kind === "line") {
    return LineChart;
  }
  if (kind === "bar") {
    return BarChart;
  }
  return AreaChart;
}

export function AccountSeriesChartCard({
  title,
  description,
  kind,
  rows,
  config,
  allKeys,
  hiddenKeys,
  onToggleSeries,
  hoverIndex,
  onHoverChange,
  markers,
  emptyMessage,
}: AccountSeriesChartCardProps) {
  const Chart = chartFor(kind);
  const seriesKeys = allKeys.filter((key) => !hiddenKeys.has(key));
  const hasData = rows.length > 0 && seriesKeys.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <Chart
            className={CHART_CLASS}
            config={config}
            data={rows}
            markerIndex={hoverIndex}
            onHoverChange={onHoverChange}
            stackType={kind === "bar" ? "stacked" : "default"}
          >
            <Grid />
            <XAxis dataKey="day" />
            <YAxis />
            {seriesKeys.map((key) => {
              if (kind === "line") {
                return <Line dataKey={key} key={key} />;
              }
              if (kind === "bar") {
                return <Bar dataKey={key} key={key} />;
              }
              return <Area dataKey={key} key={key} />;
            })}
            {markers.map((marker) => (
              <VerticalMarker
                index={marker.index}
                key={marker.label}
                label={marker.label}
              />
            ))}
            <Tooltip labelKey="day" />
          </Chart>
        ) : (
          <p className="flex h-56 items-center justify-center text-muted-foreground text-sm">
            {emptyMessage}
          </p>
        )}
        <ChartSeriesLegend
          config={config}
          hiddenKeys={hiddenKeys}
          onToggle={onToggleSeries}
          orderedKeys={allKeys}
        />
      </CardContent>
    </Card>
  );
}
