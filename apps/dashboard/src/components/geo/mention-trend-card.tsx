"use client";

import { useMemo } from "react";
import { EChartsLineChart } from "@/components/evilcharts/charts/echarts-line-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { GEO_ENGINE_LABELS, GEO_TREND_MIN_DAYS } from "@/constants/geo";
import type { MentionTrendCardProps } from "@/types/geo";
import { accountSeriesColors } from "@/utils/chart-colors";
import { chartKey } from "@/utils/chart-keys";
import { buildMentionRateRows } from "@/utils/geo-charts";

export function MentionTrendCard({
  hero = false,
  points,
}: MentionTrendCardProps) {
  const { rows, engines } = useMemo(
    () => buildMentionRateRows(points),
    [points]
  );

  const series = useMemo(
    () => engines.map((engine) => ({ key: chartKey(engine), engine })),
    [engines]
  );

  const config = useMemo(() => {
    const trendConfig: ChartConfig = {};
    for (const [index, entry] of series.entries()) {
      trendConfig[entry.key] = {
        label: GEO_ENGINE_LABELS[entry.engine] ?? entry.engine,
        colors: accountSeriesColors(index),
      };
    }
    return trendConfig;
  }, [series]);

  return (
    <InstrumentModule eyebrow="Mention rate trend" readout="daily · per engine">
      {rows.length < GEO_TREND_MIN_DAYS ? (
        <InstrumentEmpty
          className="h-64"
          message={`Trend appears after ${GEO_TREND_MIN_DAYS} days of scans`}
          seed="Mention rate trend"
        />
      ) : (
        <EChartsLineChart
          className="h-64 w-full"
          config={config}
          curveType="monotone"
          data={rows}
          enableHoverHighlight
          xDataKey="day"
        >
          <EChartsLineChart.Grid />
          <EChartsLineChart.XAxis dataKey="day" />
          <EChartsLineChart.YAxis tickFormatter={(value) => `${value}%`} />
          {series.map((entry) => (
            <EChartsLineChart.Line
              dataKey={entry.key}
              glowing={hero}
              key={entry.key}
            />
          ))}
          <EChartsLineChart.Tooltip />
        </EChartsLineChart>
      )}
    </InstrumentModule>
  );
}
