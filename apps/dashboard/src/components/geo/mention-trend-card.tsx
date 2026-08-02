"use client";

import { Line } from "@notra/ui/components/dither-kit/area";
import { LineChart } from "@notra/ui/components/dither-kit/area-chart";
import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { Grid } from "@notra/ui/components/dither-kit/grid";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import { XAxis } from "@notra/ui/components/dither-kit/x-axis";
import { YAxis } from "@notra/ui/components/dither-kit/y-axis";
import { useMemo } from "react";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { ACCOUNT_SERIES_COLORS } from "@/constants/analytics";
import { GEO_ENGINE_LABELS, GEO_TREND_MIN_DAYS } from "@/constants/geo";
import type { MentionTrendCardProps } from "@/types/geo";
import { buildMentionRateRows } from "@/utils/geo-charts";

export function MentionTrendCard({
  hero = false,
  points,
}: MentionTrendCardProps) {
  const { rows, engines } = useMemo(
    () => buildMentionRateRows(points),
    [points]
  );

  const config = useMemo(() => {
    const trendConfig: ChartConfig = {};
    engines.forEach((engine, index) => {
      trendConfig[engine] = {
        label: GEO_ENGINE_LABELS[engine] ?? engine,
        color:
          ACCOUNT_SERIES_COLORS[index % ACCOUNT_SERIES_COLORS.length] ??
          "purple",
      };
    });
    return trendConfig;
  }, [engines]);

  return (
    <InstrumentModule eyebrow="Mention rate trend" readout="daily · per engine">
      {rows.length < GEO_TREND_MIN_DAYS ? (
        <InstrumentEmpty
          className="h-64"
          message={`Trend appears after ${GEO_TREND_MIN_DAYS} days of scans`}
          seed="Mention rate trend"
        />
      ) : (
        <LineChart
          bloom={hero ? "low" : "off"}
          className="h-64 w-full"
          config={config}
          data={rows}
        >
          <Grid />
          <XAxis dataKey="day" />
          <YAxis />
          {engines.map((engine) => (
            <Line dataKey={engine} key={engine} />
          ))}
          <Tooltip labelKey="day" valueFormatter={(value) => `${value}%`} />
        </LineChart>
      )}
    </InstrumentModule>
  );
}
