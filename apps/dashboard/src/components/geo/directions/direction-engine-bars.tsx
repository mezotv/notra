"use client";

import { useMemo } from "react";
import { DirectionBar } from "@/components/geo/directions/direction-bar";
import { EngineIcon } from "@/components/geo/engine-icon";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_DIRECTIONS_ENGINES } from "@/constants/geo-directions";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { cn } from "@/lib/utils";
import type {
  DirectionBlockProps,
  GeoDirectionEngineRow,
} from "@/types/geo-directions";
import { formatDirectionRate } from "@/utils/geo-directions";
import { tableHeightFor } from "@/utils/table";

const MAX_RATE = 1;

export function DirectionEngineBars({ className }: DirectionBlockProps) {
  const columns = useMemo<TableColumn<GeoDirectionEngineRow>[]>(
    () => [
      {
        key: "label",
        header: "Engine",
        width: "1.2fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2 font-medium text-sm">
            <EngineIcon engine={row.engine} />
            <span className="truncate">{row.label}</span>
          </span>
        ),
      },
      {
        key: "bar",
        header: "Mention rate",
        width: "2fr",
        cell: (row) => <DirectionBar max={MAX_RATE} value={row.rate} />,
        sortValue: (row) => row.rate,
      },
      {
        key: "rate",
        header: "Rate",
        width: "6.25rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">
            {formatDirectionRate(row.rate)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
        <span>{GEO_DIRECTIONS_ENGINES.length.toLocaleString()} engines</span>
      </div>
      <Table
        className="rounded-2xl"
        columns={columns}
        data={[...GEO_DIRECTIONS_ENGINES]}
        defaultSort={{ key: "rate", direction: "desc" }}
        emptyState="No engines scanned yet"
        getRowId={(row) => row.engine}
        height={tableHeightFor(GEO_DIRECTIONS_ENGINES.length)}
        resizable
        rowHeight={TABLE_ROW_HEIGHT}
      />
    </div>
  );
}
