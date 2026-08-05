"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoTrafficPage, TrafficPagesCardProps } from "@/types/geo";
import { formatGeoSource } from "@/utils/ai-traffic";
import { tableHeightFor } from "@/utils/table";

export function TrafficPagesCard({ pages }: TrafficPagesCardProps) {
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
        width: "6.25rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{row.visits}</span>
        ),
      },
    ],
    []
  );

  return (
    <InstrumentSection
      eyebrow="Top pages by AI source"
      readout={
        pages.length > 0 ? `${pages.length} pages · 30D` : "no AI visits yet"
      }
    >
      {pages.length === 0 ? (
        <InstrumentEmpty
          message="No AI visits captured yet"
          seed="geo-traffic-pages"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
            <span>{pages.length.toLocaleString()} pages</span>
          </div>
          <Table
            className="rounded-2xl"
            columns={columns}
            data={pages}
            defaultSort={{ key: "visits", direction: "desc" }}
            emptyState="No AI visits captured yet"
            getRowId={(row) => `${row.path}-${row.visitorType}-${row.source}`}
            height={tableHeightFor(pages.length)}
            resizable
            rowHeight={TABLE_ROW_HEIGHT}
          />
        </div>
      )}
    </InstrumentSection>
  );
}
