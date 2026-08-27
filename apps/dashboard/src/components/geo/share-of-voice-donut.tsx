"use client";

import { useMemo } from "react";

import { ChartColorScope } from "@/components/charts/chart-color-scope";
import { EChartsPieChart } from "@/components/evilcharts/charts/echarts-pie-chart";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { InstrumentEmpty } from "@/components/instrument/instrument-module";
import {
  CHART_OTHER_SLICE_LABEL,
  DONUT_INNER_RADIUS,
  DONUT_OUTER_RADIUS,
} from "@/constants/charts";
import { findCompetitorDomain } from "@/lib/geo/domain";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/types/charts";
import type {
  GeoCompetitor,
  ShareOfVoiceDonutProps,
  ShareOfVoiceDonutSlice,
} from "@/types/geo";
import { seriesColors } from "@/utils/chart-colors";
import {
  buildShareOfVoiceRows,
  formatMentionRate,
  toShareOfVoiceDonutSlices,
} from "@/utils/geo-charts";
import {
  shareOfVoiceRivalIndex,
  shareOfVoiceSliceColor,
} from "@/utils/geo-competitors";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

function ShareOfVoiceLegendRow({
  row,
  competitors,
  onClick,
  onPointerEnter,
}: {
  row: ShareOfVoiceDonutSlice;
  competitors?: GeoCompetitor[];
  onClick?: () => void;
  onPointerEnter?: () => void;
}) {
  const content = (
    <>
      <span
        className="size-2 shrink-0 rounded-[0.0625rem]"
        style={{ backgroundColor: `var(--color-${row.slice}-0)` }}
      />
      {row.brand === CHART_OTHER_SLICE_LABEL ? (
        <span aria-hidden="true" className="size-4 shrink-0" />
      ) : (
        <CompetitorLogo
          className="size-4 shrink-0"
          domain={findCompetitorDomain(competitors, row.brand)}
          name={row.brand}
        />
      )}
      <span className="text-muted-foreground min-w-0 flex-1 truncate">
        {row.brand}
      </span>
      <span className="shrink-0 tabular-nums">
        {formatMentionRate(row.share)}
      </span>
      <span className="text-muted-foreground w-12 shrink-0 text-right tabular-nums">
        {row.mentions.toLocaleString()}
      </span>
    </>
  );

  const className = "flex w-full items-center gap-1.5 px-1 py-0.5 text-xs";

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      className={cn(
        className,
        "hover:bg-muted/60 rounded-md text-left transition-colors"
      )}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      type="button"
    >
      {content}
    </button>
  );
}

export function ShareOfVoiceDonut({
  points,
  competitors,
  limit,
  isScanning = false,
  onSliceClick,
  onSlicePointerEnter,
  companyName,
  aliases,
}: ShareOfVoiceDonutProps) {
  const { slices, config, caption, totalMentions } = useMemo(() => {
    const ownBrand = { companyName, aliases };
    const rows = toShareOfVoiceDonutSlices(
      buildShareOfVoiceRows(points, { limit, competitors })
    );
    const sliceConfig: ChartConfig = {};
    for (const row of rows) {
      sliceConfig[row.slice] = {
        label: row.brand,
        colors: seriesColors(
          shareOfVoiceSliceColor(
            row.brand,
            shareOfVoiceRivalIndex(rows, row.brand, ownBrand),
            competitors,
            ownBrand
          )
        ),
      };
    }
    const top = rows.find((row) => row.brand !== CHART_OTHER_SLICE_LABEL);
    const totalMentions = rows.reduce((sum, row) => sum + row.mentions, 0);
    return {
      slices: rows,
      config: sliceConfig,
      caption: top
        ? `${top.brand} · ${formatMentionRate(top.share)} of mentions`
        : null,
      totalMentions,
    };
  }, [aliases, companyName, competitors, limit, points]);

  if (slices.length === 0) {
    return (
      <InstrumentEmpty
        busy={isScanning}
        className="h-56"
        message={geoScanEmptyMessage(isScanning, "No competitor data yet")}
        seed="Share of voice"
      />
    );
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="flex flex-col">
        <div className="flex flex-1 flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <EChartsPieChart
            animation={false}
            className="h-56 w-full min-w-0 sm:w-1/2"
            config={config}
            data={slices}
            dataKey="mentions"
            nameKey="slice"
          >
            <EChartsPieChart.Pie
              innerRadius={DONUT_INNER_RADIUS}
              outerRadius={DONUT_OUTER_RADIUS}
            />
            <EChartsPieChart.Tooltip
              barMax={totalMentions}
              layout="bars"
              valueFormatter={(mentions) =>
                totalMentions > 0
                  ? formatMentionRate(mentions / totalMentions)
                  : formatMentionRate(0)
              }
            />
          </EChartsPieChart>
          <ChartColorScope className="min-w-0 flex-1" config={config}>
            <ul className="space-y-1.5">
              {slices.map((row) => {
                const canOpen =
                  Boolean(onSliceClick) &&
                  row.brand !== CHART_OTHER_SLICE_LABEL;
                return (
                  <li key={row.slice}>
                    <ShareOfVoiceLegendRow
                      competitors={competitors}
                      onClick={canOpen ? () => onSliceClick?.(row) : undefined}
                      onPointerEnter={
                        canOpen ? () => onSlicePointerEnter?.(row) : undefined
                      }
                      row={row}
                    />
                  </li>
                );
              })}
            </ul>
          </ChartColorScope>
        </div>
        {caption ? (
          <p className="text-muted-foreground mt-2 truncate text-[0.6875rem]">
            {caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}
