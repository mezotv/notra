"use client";

import type { GeoTrafficPage } from "@notra/geo-core/types/geo";
import { formatGeoSource } from "@notra/geo-core/utils/ai-traffic";

import { EngineIcon } from "@/components/geo/engine-icon";
import { Table, type TableColumn } from "@/components/motion/table";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import { GEO_DIRECTIONS_PAGES } from "@/constants/geo-directions";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { cn } from "@/lib/utils";
import type { DirectionBlockProps } from "@/types/geo-directions";
import { formatDirectionCount } from "@/utils/geo-directions";
import { tableHeightFor } from "@/utils/table";

export function DirectionPagesTable({ className }: DirectionBlockProps) {
  const columns: TableColumn<GeoTrafficPage>[] = [
    {
      key: "path",
      header: "Page",
      width: "1.5fr",
      sortable: true,
      cell: (row) => (
        <TruncateWithTooltip className="font-mono text-xs">
          {row.path}
        </TruncateWithTooltip>
      ),
    },
    {
      key: "source",
      header: "Source",
      width: "1fr",
      sortable: true,
      cell: (row) => (
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <EngineIcon engine={row.source} />
          <span className="truncate">{formatGeoSource(row.source)}</span>
        </span>
      ),
      sortValue: (row) => formatGeoSource(row.source),
    },
    {
      key: "visits",
      header: "Visits",
      width: "6.5rem",
      sortable: true,
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {formatDirectionCount(row.visits)}
        </span>
      ),
    },
  ];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="text-muted-foreground flex items-center justify-between px-1 text-xs">
        <span>{GEO_DIRECTIONS_PAGES.length.toLocaleString()} pages</span>
      </div>
      <Table
        className="rounded-2xl"
        columns={columns}
        data={[...GEO_DIRECTIONS_PAGES]}
        defaultSort={{ key: "visits", direction: "desc" }}
        emptyState="No AI visits captured yet"
        getRowId={(row) => row.path}
        height={tableHeightFor(GEO_DIRECTIONS_PAGES.length)}
        resizable
        rowHeight={TABLE_ROW_HEIGHT}
      />
    </div>
  );
}
