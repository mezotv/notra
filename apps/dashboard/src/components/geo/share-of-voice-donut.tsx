"use client";

import { useMemo } from "react";
import { ChartColorScope } from "@/components/charts/chart-color-scope";
import { EChartsPieChart } from "@/components/evilcharts/charts/echarts-pie-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import {
  CHART_OTHER_SLICE_LABEL,
  DONUT_INNER_RADIUS,
  DONUT_OUTER_RADIUS,
} from "@/constants/charts";
import { findCompetitorDomain } from "@/lib/geo/domain";
import type { ShareOfVoiceDonutProps, ShareOfVoiceSlice } from "@/types/geo";
import { donutSliceColors } from "@/utils/chart-colors";
import { chartKey } from "@/utils/chart-keys";

const TOP_SLICES = 5;
const PERCENT = 100;

export function ShareOfVoiceDonut({
  points,
  competitors,
  action,
}: ShareOfVoiceDonutProps) {
  const { rows, config, total, caption } = useMemo(() => {
    const top = points.slice(0, TOP_SLICES);
    const rest = points.slice(TOP_SLICES);
    const brands = top.map((point) => ({
      brand: point.brand,
      mentions: point.mentions,
    }));
    const otherTotal = rest.reduce((sum, point) => sum + point.mentions, 0);
    if (otherTotal > 0) {
      brands.push({ brand: CHART_OTHER_SLICE_LABEL, mentions: otherTotal });
    }
    const sliceRows: ShareOfVoiceSlice[] = brands.map((row, index) => ({
      ...row,
      slice: chartKey(`${row.brand}-${index}`),
    }));
    const sliceConfig: ChartConfig = {};
    for (const [index, row] of sliceRows.entries()) {
      sliceConfig[row.slice] = {
        label: row.brand,
        colors: donutSliceColors(index, row.brand),
      };
    }
    const sliceTotal = sliceRows.reduce((sum, row) => sum + row.mentions, 0);
    const topSlice = sliceRows.reduce<ShareOfVoiceSlice | null>(
      (best, row) =>
        row.brand !== CHART_OTHER_SLICE_LABEL &&
        (best === null || row.mentions > best.mentions)
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
            <EChartsPieChart
              className="h-56 w-1/2 min-w-0"
              config={config}
              data={rows}
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
              className="min-w-0 flex-1 space-y-1.5"
              config={config}
            >
              {rows.map((row) => (
                <div
                  className="flex items-center gap-1.5 text-xs"
                  key={row.slice}
                >
                  <span
                    className="size-2 shrink-0 rounded-[0.0625rem]"
                    style={{ backgroundColor: `var(--color-${row.slice}-0)` }}
                  />
                  {row.brand !== CHART_OTHER_SLICE_LABEL && (
                    <CompetitorLogo
                      className="size-3.5"
                      domain={findCompetitorDomain(competitors, row.brand)}
                      name={row.brand}
                    />
                  )}
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
            </ChartColorScope>
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
