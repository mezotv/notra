"use client";

import { useMemo } from "react";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { findCompetitorDomain } from "@/lib/geo/domain";
import type { ShareOfVoiceCardProps, ShareOfVoiceRow } from "@/types/geo";
import {
  barWidthPercent,
  buildShareOfVoiceRows,
  formatMentionRate,
} from "@/utils/geo-charts";
import { tableHeightFor } from "@/utils/table";

export function ShareOfVoiceCard({
  points,
  competitors,
  action,
}: ShareOfVoiceCardProps) {
  const rows = useMemo(() => buildShareOfVoiceRows(points), [points]);
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
            <span className="block h-2 w-full max-w-40 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full bg-chart-1"
                style={{ width: `${barWidthPercent(row.share, maxShare)}%` }}
              />
            </span>
            <span className="shrink-0 text-xs tabular-nums">
              {formatMentionRate(row.share)}
            </span>
          </span>
        ),
      },
      {
        key: "mentions",
        header: "Mentions",
        width: "7rem",
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

  return (
    <InstrumentSection
      action={action}
      eyebrow="Share of voice"
      readout={rows.length > 0 ? "30D" : undefined}
    >
      {rows.length === 0 ? (
        <InstrumentEmpty
          className="h-56"
          message="No competitor data yet"
          seed="Share of voice"
        />
      ) : (
        <Table
          className="rounded-2xl"
          columns={columns}
          data={rows}
          defaultSort={{ key: "share", direction: "desc" }}
          emptyState="No competitor data yet"
          getRowId={(row) => row.brand}
          height={tableHeightFor(rows.length)}
          resizable
          rowHeight={TABLE_ROW_HEIGHT}
        />
      )}
    </InstrumentSection>
  );
}
