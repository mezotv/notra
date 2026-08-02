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
import type { GeoCompetitorSharePoint } from "@/types/geo";

interface CompetitorShareCardProps {
  points: GeoCompetitorSharePoint[];
  companyName: string | null;
}

const chartConfig: ChartConfig = {
  mentions: { label: "Mentions", color: "orange" },
};

export function CompetitorShareCard({
  points,
  companyName,
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
          <BarChart className="h-56 w-full" config={chartConfig} data={rows}>
            <Grid />
            <XAxis dataKey="brand" />
            <YAxis />
            <Bar dataKey="mentions" />
            <Tooltip inlineHeading labelKey="brand" />
          </BarChart>
        )}
      </CardContent>
    </Card>
  );
}
