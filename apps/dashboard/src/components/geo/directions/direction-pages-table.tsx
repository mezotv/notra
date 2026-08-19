"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_DIRECTIONS_PAGES } from "@/constants/geo-directions";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { cn } from "@/lib/utils";
import type { GeoTrafficPage } from "@/types/geo";
import type { DirectionBlockProps } from "@/types/geo-directions";
import { formatGeoSource } from "@/utils/ai-traffic";
import { formatDirectionCount } from "@/utils/geo-directions";
import { tableHeightFor } from "@/utils/table";

export function DirectionPagesTable({ className }: DirectionBlockProps) {
  const columns = useMemo<TableColumn<GeoTrafficPage>[]>(
    () => [
      {
        key: "path",
        header: "Page",
        width: "2fr",
        sortable: true,
        cell: (row) => (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="block truncate font-mono text-xs">
                  {row.path}
                </span>
              }
            />
            <TooltipContent className="max-w-sm">{row.path}</TooltipContent>
          </Tooltip>
        ),
      },
      {
        key: "source",
        header: "Source",
        width: "1.2fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <EngineIcon engine={row.source} />
            <span className="truncate">
              {formatGeoSource(row.source, row.visitorType)}
            </span>
          </span>
        ),
        sortValue: (row) => formatGeoSource(row.source, row.visitorType),
      },
      {
        key: "visits",
        header: "Visits",
        width: "6.875rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">
            {formatDirectionCount(row.visits)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
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
