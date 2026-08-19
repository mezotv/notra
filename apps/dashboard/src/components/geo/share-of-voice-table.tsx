"use client";

import { useMemo } from "react";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { GeoBar } from "@/components/geo/geo-bar";
import { InstrumentEmpty } from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { findCompetitorDomain } from "@/lib/geo/domain";
import type { ShareOfVoiceRow, ShareOfVoiceTableProps } from "@/types/geo";
import { buildShareOfVoiceRows, formatMentionRate } from "@/utils/geo-charts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";
import { tableHeightFor } from "@/utils/table";

export function ShareOfVoiceTable({
  points,
  competitors,
  limit,
  isScanning = false,
  onRowClick,
  onRowPointerEnter,
}: ShareOfVoiceTableProps) {
  const rows = useMemo(
    () => buildShareOfVoiceRows(points, { limit, competitors }),
    [points, limit, competitors]
  );
  const maxShare = rows.reduce((max, row) => Math.max(max, row.share), 0);

  const columns = useMemo<TableColumn<ShareOfVoiceRow>[]>(
    () => [
      {
        key: "brand",
        header: "Brand",
        width: "1.2fr",
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
        width: "1.6fr",
        sortable: true,
        sortValue: (row) => row.share,
        cell: (row) => (
          <span className="flex items-center gap-2">
            <GeoBar className="h-2 max-w-40" max={maxShare} value={row.share} />
            <span className="shrink-0 text-xs tabular-nums">
              {formatMentionRate(row.share)}
            </span>
          </span>
        ),
      },
      {
        key: "mentions",
        header: "Mentions",
        width: "8.75rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">
            {row.mentions.toLocaleString()}
          </span>
        ),
      },
    ],
    [competitors, maxShare]
  );

  if (rows.length === 0) {
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
    <Table
      className="rounded-2xl"
      columns={columns}
      data={rows}
      defaultSort={{ key: "share", direction: "desc" }}
      emptyState="No competitor data yet"
      getRowId={(row) => row.brand}
      height={tableHeightFor(rows.length)}
      onRowClick={onRowClick}
      onRowPointerEnter={onRowPointerEnter}
      resizable
      rowHeight={TABLE_ROW_HEIGHT}
    />
  );
}
