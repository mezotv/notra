"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { findCompetitorDomain } from "@notra/geo-core/geo/domain";
import type {
  GeoCompetitor,
  ShareOfVoiceDonutSlice,
  ShareOfVoiceRow,
} from "@notra/geo-core/types/geo";
import { geoScanEmptyMessage } from "@notra/geo-core/utils/geo-scan";
import { type CSSProperties, type ReactNode, useMemo, useState } from "react";

import { ChartColorScope } from "@/components/charts/chart-color-scope";
import { EChartsPieChart } from "@/components/evilcharts/charts/echarts-pie-chart";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { ShareOfVoiceOtherSheet } from "@/components/geo/share-of-voice-other-sheet";
import { InstrumentEmpty } from "@/components/instrument/instrument-module";
import {
  CHART_OTHER_SLICE_LABEL,
  DONUT_INNER_RADIUS,
  DONUT_OUTER_RADIUS,
} from "@/constants/charts";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/types/charts";
import type { ShareOfVoiceDonutProps } from "@/types/geo";
import { seriesColors } from "@/utils/chart-colors";
import {
  buildShareOfVoiceBreakdown,
  formatMentionRate,
  toShareOfVoiceDonutSlices,
} from "@/utils/geo-charts";
import {
  shareOfVoiceRivalIndex,
  shareOfVoiceSliceColor,
} from "@/utils/geo-competitors";

const LEGEND_ROW_CLASS = "flex w-full items-center gap-1.5 px-1 py-0.5 text-xs";
const LEGEND_ROW_INTERACTIVE_CLASS =
  "hover:bg-muted/60 cursor-pointer rounded-md text-left transition-colors";

function sliceSwatchStyle(slice: string): CSSProperties {
  return { backgroundColor: `var(--color-${slice}-0)` };
}

function ShareOfVoiceLegendContent({
  row,
  competitors,
  leading,
  swatchStyle,
}: {
  row: ShareOfVoiceRow;
  competitors?: GeoCompetitor[];
  leading?: ReactNode;
  swatchStyle: CSSProperties;
}) {
  return (
    <>
      <span
        className="size-2 shrink-0 rounded-[0.0625rem]"
        style={swatchStyle}
      />
      {leading ??
        (row.brand === CHART_OTHER_SLICE_LABEL ? (
          <span aria-hidden="true" className="size-4 shrink-0" />
        ) : (
          <CompetitorLogo
            className="size-4 shrink-0"
            domain={findCompetitorDomain(competitors, row.brand)}
            name={row.brand}
          />
        ))}
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
}

function ShareOfVoiceLegendRow({
  row,
  competitors,
  swatchStyle,
  onClick,
  onPointerEnter,
}: {
  row: ShareOfVoiceRow;
  competitors?: GeoCompetitor[];
  swatchStyle: CSSProperties;
  onClick?: () => void;
  onPointerEnter?: () => void;
}) {
  const content = (
    <ShareOfVoiceLegendContent
      competitors={competitors}
      row={row}
      swatchStyle={swatchStyle}
    />
  );

  if (!onClick) {
    return <div className={LEGEND_ROW_CLASS}>{content}</div>;
  }

  return (
    <button
      className={cn(LEGEND_ROW_CLASS, LEGEND_ROW_INTERACTIVE_CLASS)}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      type="button"
    >
      {content}
    </button>
  );
}

function ShareOfVoiceOtherLegend({
  row,
  others,
  competitors,
  swatchStyle,
  onOpen,
}: {
  row: ShareOfVoiceDonutSlice;
  others: readonly ShareOfVoiceRow[];
  competitors?: GeoCompetitor[];
  swatchStyle: CSSProperties;
  onOpen: () => void;
}) {
  return (
    <button
      className={cn(LEGEND_ROW_CLASS, LEGEND_ROW_INTERACTIVE_CLASS)}
      onClick={onOpen}
      type="button"
    >
      <ShareOfVoiceLegendContent
        competitors={competitors}
        leading={
          <span className="flex size-4 shrink-0 items-center justify-center">
            <HugeiconsIcon
              aria-hidden="true"
              className="size-3"
              icon={ArrowRight01Icon}
              strokeWidth={2}
            />
          </span>
        }
        row={row}
        swatchStyle={swatchStyle}
      />
      <span className="sr-only">{`Show ${others.length} brands in Other`}</span>
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
  const [otherOpen, setOtherOpen] = useState(false);
  const { slices, others, other, config, caption, totalMentions } =
    useMemo(() => {
      const ownBrand = { companyName, aliases };
      const breakdown = buildShareOfVoiceBreakdown(points, {
        limit,
        competitors,
      });
      const rows = toShareOfVoiceDonutSlices(breakdown.rows);
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
      const otherRow = rows.find(
        (row) => row.brand === CHART_OTHER_SLICE_LABEL
      );
      const mentions = rows.reduce((sum, row) => sum + row.mentions, 0);
      return {
        slices: rows,
        others: breakdown.others,
        other: otherRow,
        config: sliceConfig,
        caption: top
          ? `${top.brand} · ${formatMentionRate(top.share)} of mentions`
          : null,
        totalMentions: mentions,
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
    <>
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
                  const swatchStyle = sliceSwatchStyle(row.slice);
                  if (
                    row.brand === CHART_OTHER_SLICE_LABEL &&
                    others.length > 0
                  ) {
                    return (
                      <li key={row.slice}>
                        <ShareOfVoiceOtherLegend
                          competitors={competitors}
                          onOpen={() => setOtherOpen(true)}
                          others={others}
                          row={row}
                          swatchStyle={swatchStyle}
                        />
                      </li>
                    );
                  }
                  const canOpen =
                    Boolean(onSliceClick) &&
                    row.brand !== CHART_OTHER_SLICE_LABEL;
                  return (
                    <li key={row.slice}>
                      <ShareOfVoiceLegendRow
                        competitors={competitors}
                        onClick={
                          canOpen ? () => onSliceClick?.(row) : undefined
                        }
                        onPointerEnter={
                          canOpen ? () => onSlicePointerEnter?.(row) : undefined
                        }
                        row={row}
                        swatchStyle={swatchStyle}
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
      {other && others.length > 0 ? (
        <ShareOfVoiceOtherSheet
          aliases={aliases}
          companyName={companyName}
          competitors={competitors}
          onBrandClick={onSliceClick}
          onBrandPointerEnter={onSlicePointerEnter}
          onOpenChange={setOtherOpen}
          open={otherOpen}
          other={other}
          others={others}
        />
      ) : null}
    </>
  );
}
