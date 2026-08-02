"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { PALETTE, rgb } from "@notra/ui/components/dither-kit/palette";
import { Pie } from "@notra/ui/components/dither-kit/pie";
import { PieChart } from "@notra/ui/components/dither-kit/pie-chart";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import { ACCOUNT_SERIES_COLORS } from "@/constants/analytics";
import type { GeoCompetitorSharePoint } from "@/types/geo";

interface ShareOfVoiceDonutProps {
  points: GeoCompetitorSharePoint[];
  companyName: string | null;
}

interface SliceRow {
  brand: string;
  mentions: number;
}

const TOP_SLICES = 5;
const DONUT_INNER_RADIUS = 0.55;

export function ShareOfVoiceDonut({
  points,
  companyName,
}: ShareOfVoiceDonutProps) {
  const { rows, config, total } = useMemo(() => {
    const top = points.slice(0, TOP_SLICES);
    const rest = points.slice(TOP_SLICES);
    const sliceRows: SliceRow[] = top.map((point) => ({
      brand: point.brand,
      mentions: point.mentions,
    }));
    const otherTotal = rest.reduce((sum, point) => sum + point.mentions, 0);
    if (otherTotal > 0) {
      sliceRows.push({ brand: "Other", mentions: otherTotal });
    }
    const sliceConfig: ChartConfig = {};
    sliceRows.forEach((row, index) => {
      sliceConfig[row.brand] = {
        label: row.brand,
        color:
          row.brand === "Other"
            ? "grey"
            : (ACCOUNT_SERIES_COLORS[index % ACCOUNT_SERIES_COLORS.length] ??
              "blue"),
      };
    });
    return {
      rows: sliceRows,
      config: sliceConfig,
      total: sliceRows.reduce((sum, row) => sum + row.mentions, 0),
    };
  }, [points]);

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
          <div className="flex items-center gap-4">
            <PieChart
              className="h-56 w-1/2 min-w-0"
              config={config}
              data={rows}
              dataKey="mentions"
              innerRadius={DONUT_INNER_RADIUS}
              nameKey="brand"
            >
              <Pie />
              <Tooltip inlineHeading />
            </PieChart>
            <div className="min-w-0 flex-1 space-y-1.5">
              {rows.map((row) => (
                <div
                  className="flex items-center gap-1.5 text-sm"
                  key={row.brand}
                >
                  <span
                    className="size-2 shrink-0 rounded-[0.0625rem]"
                    style={{
                      backgroundColor: rgb(
                        PALETTE[config[row.brand]?.color ?? "grey"].fill
                      ),
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {row.brand}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {total > 0
                      ? `${Math.round((row.mentions / total) * 100)}%`
                      : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
