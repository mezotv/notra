"use client";

import { type ReactNode, useMemo } from "react";

import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { TrafficDeltaBadge } from "@/components/geo/traffic-delta-badge";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoTrafficPage, TrafficPagesCardProps } from "@/types/geo";
import { formatGeoSource, trafficVisitDelta } from "@/utils/ai-traffic";
import { tableHeightFor } from "@/utils/table";

const PAGE_SKELETON_ROWS = 4;
const PAGE_COLUMN_WIDTH = "1.5fr";
const SOURCE_COLUMN_WIDTH = "1fr";
const VISITS_COLUMN_WIDTH = "9.5rem";

export function TrafficPagesCard({
  pages,
  isPending = false,
}: TrafficPagesCardProps) {
  const columns = useMemo<TableColumn<GeoTrafficPage>[]>(
    () => [
      {
        key: "path",
        header: "Page",
        width: PAGE_COLUMN_WIDTH,
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
        width: SOURCE_COLUMN_WIDTH,
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
        width: VISITS_COLUMN_WIDTH,
        align: "right",
        sortable: true,
        cell: (row) => {
          const delta =
            row.previousVisits === undefined
              ? null
              : trafficVisitDelta(row.visits, row.previousVisits);

          return (
            <span className="flex items-center justify-end gap-2">
              <TrafficDeltaBadge delta={delta} />
              <span className="text-sm tabular-nums">
                {row.visits.toLocaleString()}
              </span>
            </span>
          );
        },
      },
    ],
    []
  );

  let body: ReactNode;
  if (isPending) {
    body = <GeoTableSkeleton rows={PAGE_SKELETON_ROWS} />;
  } else if (pages.length === 0) {
    body = (
      <InstrumentEmpty
        message="No AI visits captured yet"
        seed="geo-traffic-pages"
      />
    );
  } else {
    body = (
      <div className="flex flex-col gap-2">
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
    );
  }

  return (
    <InstrumentSection
      eyebrow={
        pages.length > 0
          ? `Top pages by AI source (${pages.length.toLocaleString()})`
          : "Top pages by AI source"
      }
    >
      {body}
    </InstrumentSection>
  );
}
