"use client";

import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { PALETTE, rgb } from "@notra/ui/components/dither-kit/palette";
import { Pie } from "@notra/ui/components/dither-kit/pie";
import { PieChart } from "@notra/ui/components/dither-kit/pie-chart";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { ACCOUNT_SERIES_COLORS } from "@/constants/analytics";
import type { GeoCompetitorSharePoint } from "@/types/geo";

interface ShareOfVoiceDonutProps {
  points: GeoCompetitorSharePoint[];
  action?: ReactNode;
}

interface SliceRow {
  brand: string;
  mentions: number;
}

const TOP_SLICES = 5;
const PERCENT = 100;
const DONUT_INNER_RADIUS = 0.55;

export function ShareOfVoiceDonut({ points, action }: ShareOfVoiceDonutProps) {
  const { rows, config, total, caption } = useMemo(() => {
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
    const sliceTotal = sliceRows.reduce((sum, row) => sum + row.mentions, 0);
    const topSlice = sliceRows.reduce<SliceRow | null>(
      (best, row) =>
        row.brand !== "Other" && (best === null || row.mentions > best.mentions)
          ? row
          : best,
      null
    );
    return {
      rows: sliceRows,
      config: sliceConfig,
      total: sliceTotal,
      caption:
        topSlice && sliceTotal > 0
          ? `${topSlice.brand} · ${Math.round((topSlice.mentions / sliceTotal) * PERCENT)}% of mentions`
          : null,
    };
  }, [points]);

  return (
    <InstrumentModule action={action} eyebrow="Share of voice">
      {rows.length === 0 ? (
        <InstrumentEmpty
          className="h-56"
          message="No competitor data yet"
          seed="Share of voice"
        />
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex flex-1 items-center gap-4">
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
                  className="flex items-center gap-1.5 font-mono text-xs"
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
                      ? `${Math.round((row.mentions / total) * PERCENT)}%`
                      : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {caption && (
            <p className="mt-2 truncate text-[0.6875rem] text-muted-foreground">
              {caption}
            </p>
          )}
        </div>
      )}
    </InstrumentModule>
  );
}
