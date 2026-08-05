"use client";

import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { cn } from "@/lib/utils";
import type { GeoModelUsageRow, ModelUsageCardProps } from "@/types/geo";
import {
  formatMentionRate,
  formatUsageShare,
  usageBarWidth,
} from "@/utils/geo-charts";
import { tableHeightFor } from "@/utils/table";

export function ModelUsageCard({ usage }: ModelUsageCardProps) {
  const models = useMemo(() => usage?.models ?? [], [usage]);
  const maxShare = useMemo(
    () => models.reduce((max, model) => Math.max(max, model.share), 0),
    [models]
  );
  const scannedCount = useMemo(
    () => models.filter((model) => model.scanned).length,
    [models]
  );

  const columns = useMemo<TableColumn<GeoModelUsageRow>[]>(
    () => [
      {
        key: "label",
        header: "Model",
        width: "1.4fr",
        sortable: true,
        cell: (row) => (
          <span
            className={cn(
              "flex min-w-0 items-center gap-2 text-sm",
              row.scanned ? "font-medium text-foreground" : "text-foreground/70"
            )}
          >
            <EngineIcon engine={row.model} />
            <span className="truncate">{row.label}</span>
          </span>
        ),
      },
      {
        key: "share",
        header: "Usage share",
        width: "1.6fr",
        sortable: true,
        cell: (row) => (
          <span className="block h-2 w-full overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "block h-full",
                row.scanned ? "bg-chart-1" : "bg-muted-foreground/40"
              )}
              style={{ width: `${usageBarWidth(row.share, maxShare)}%` }}
            />
          </span>
        ),
      },
      {
        key: "shareValue",
        header: "Share",
        width: "5.625rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
            {formatUsageShare(row.share)}
          </span>
        ),
        sortValue: (row) => row.share,
      },
      {
        key: "mentionRate",
        header: "Mention rate",
        width: "8.75rem",
        align: "right",
        sortable: true,
        cell: (row) =>
          row.scanned && row.mentionRate !== null ? (
            <span className="text-[0.6875rem] text-foreground tabular-nums">
              {formatMentionRate(row.mentionRate)}
            </span>
          ) : (
            <span className="text-[0.6875rem] text-muted-foreground">
              not scanned
            </span>
          ),
        sortValue: (row) => row.mentionRate ?? -1,
      },
    ],
    [maxShare]
  );

  return (
    <InstrumentSection
      eyebrow="Where AI usage actually happens"
      readout={
        models.length > 0
          ? `we scan ${scannedCount} of the top ${models.length} · ${usage?.attribution ?? ""}`
          : "industry token share per model"
      }
    >
      {models.length === 0 ? (
        <InstrumentEmpty
          className="h-40"
          message="Run a scan to capture model usage share"
          seed="Where AI usage actually happens"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
            <span>{models.length.toLocaleString()} models</span>
            <span>{scannedCount.toLocaleString()} scanned</span>
          </div>
          <Table
            className="rounded-2xl"
            columns={columns}
            data={models}
            defaultSort={{ key: "shareValue", direction: "desc" }}
            emptyState="Run a scan to capture model usage share"
            getRowId={(row) => row.model}
            height={tableHeightFor(models.length)}
            resizable
            rowHeight={TABLE_ROW_HEIGHT}
          />
        </div>
      )}
    </InstrumentSection>
  );
}
