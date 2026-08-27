"use client";

import { useMemo } from "react";

import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { GeoBar } from "@/components/geo/geo-bar";
import { GeoRateSparkline } from "@/components/geo/geo-rate-sparkline";
import { InstrumentEmpty } from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import { EMPTY_STATE_TABLE_COLUMNS } from "@/constants/empty-state";
import {
  GEO_EMPTY_COMPETITOR_SHARE_TIMESERIES,
  GEO_SPARKLINE_MIN_POINTS,
} from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { findCompetitorDomain } from "@/lib/geo/domain";
import type { ShareOfVoiceRow, ShareOfVoiceTableProps } from "@/types/geo";
import { geoModeFillClass } from "@/utils/chart-colors";
import {
  buildShareOfVoiceRows,
  formatMentionRate,
  mentionCountSparklineLabel,
} from "@/utils/geo-charts";
import {
  buildShareOfVoiceMentionSparklines,
  isOwnBrandName,
  shareOfVoiceRivalIndex,
  shareOfVoiceSliceColor,
} from "@/utils/geo-competitors";
import { geoScanEmptyMessage } from "@/utils/geo-scan";
import { GEO_VISIBILITY_TABLE_HEIGHT } from "@/utils/table";

export function ShareOfVoiceTable({
  points,
  timeseries = GEO_EMPTY_COMPETITOR_SHARE_TIMESERIES,
  competitors,
  limit,
  isScanning = false,
  onRowClick,
  onRowPointerEnter,
  companyName,
  aliases,
}: ShareOfVoiceTableProps) {
  const rows = useMemo(
    () => buildShareOfVoiceRows(points, { limit, competitors }),
    [points, limit, competitors]
  );
  const mentionSparklines = useMemo(
    () => buildShareOfVoiceMentionSparklines(timeseries, rows, competitors),
    [competitors, rows, timeseries]
  );
  const ownBrand = useMemo(
    () => ({ companyName, aliases }),
    [aliases, companyName]
  );
  const maxShare = rows.reduce((max, row) => Math.max(max, row.share), 0);

  const columns = useMemo<TableColumn<ShareOfVoiceRow>[]>(
    () => [
      {
        key: "brand",
        header: "Brand",
        width: "1fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2 text-sm">
            {row.brand !== CHART_OTHER_SLICE_LABEL && (
              <CompetitorLogo
                className="size-4 shrink-0"
                domain={findCompetitorDomain(competitors, row.brand)}
                name={row.brand}
              />
            )}
            <span className="truncate">{row.brand}</span>
          </span>
        ),
      },
      {
        key: "share",
        header: "Share",
        width: "1.3fr",
        sortable: true,
        sortValue: (row) => row.share,
        cell: (row) => {
          const own = isOwnBrandName(row.brand, companyName, aliases);
          const color = shareOfVoiceSliceColor(
            row.brand,
            shareOfVoiceRivalIndex(rows, row.brand, ownBrand),
            competitors,
            ownBrand
          );
          return (
            <span className="flex items-center gap-2">
              <GeoBar
                className="h-2 max-w-40"
                fillClassName={own ? geoModeFillClass("web") : undefined}
                fillColor={own ? undefined : color.light}
                max={maxShare}
                value={row.share}
              />
              <span className="shrink-0 text-xs tabular-nums">
                {formatMentionRate(row.share)}
              </span>
            </span>
          );
        },
      },
      {
        key: "mentions",
        header: "Mentions",
        width: "10.5rem",
        sortable: true,
        cell: (row) => {
          const series = mentionSparklines.get(row.brand) ?? [];
          const showSpark = series.length >= GEO_SPARKLINE_MIN_POINTS;
          const own = isOwnBrandName(row.brand, companyName, aliases);
          const color =
            row.brand === CHART_OTHER_SLICE_LABEL
              ? null
              : shareOfVoiceSliceColor(
                  row.brand,
                  shareOfVoiceRivalIndex(rows, row.brand, ownBrand),
                  competitors,
                  ownBrand
                );

          return (
            <span className="flex items-center gap-2">
              {showSpark ? (
                <GeoRateSparkline
                  ariaLabel={mentionCountSparklineLabel(series)}
                  className={own ? "text-geo-search" : undefined}
                  points={series}
                  style={color && !own ? { color: color.light } : undefined}
                />
              ) : null}
              <span className="text-sm tabular-nums">
                {row.mentions.toLocaleString()}
              </span>
            </span>
          );
        },
      },
    ],
    [
      aliases,
      companyName,
      competitors,
      maxShare,
      mentionSparklines,
      ownBrand,
      rows,
    ]
  );

  if (rows.length === 0) {
    return (
      <InstrumentEmpty
        busy={isScanning}
        className="h-full"
        message={geoScanEmptyMessage(
          isScanning,
          "Run a scan to see your share of voice"
        )}
        preview={
          <div className="px-4 pt-2">
            <EmptyStateTablePreview
              columns={EMPTY_STATE_TABLE_COLUMNS.shareOfVoice}
              rows={4}
            />
          </div>
        }
        seed="Share of voice"
      />
    );
  }

  return (
    <Table
      className="rounded-2xl"
      columns={columns}
      data={rows}
      defaultSort={{ key: "share", direction: "desc" }}
      emptyState="No competitor data yet"
      getRowId={(row) => row.brand}
      height={GEO_VISIBILITY_TABLE_HEIGHT}
      minHeight={GEO_VISIBILITY_TABLE_HEIGHT}
      onRowClick={onRowClick}
      onRowPointerEnter={onRowPointerEnter}
      resizable
      rowHeight={TABLE_ROW_HEIGHT}
    />
  );
}
