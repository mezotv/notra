"use client";

import { GEO_TRAFFIC_PAGES_PAGE_PARAM } from "@notra/geo-core/constants/geo";
import {
  formatGeoSource,
  trafficVisitDelta,
} from "@notra/geo-core/utils/ai-traffic";
import type { ReactNode } from "react";

import { GeoStatDelta } from "@/components/geo/geo-stat-delta";
import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { TrafficPageSourcesCell } from "@/components/geo/traffic-page-sources-cell";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TablePagination } from "@/components/table-pagination";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";
import type { GeoTrafficPageGroup, TrafficPagesCardProps } from "@/types/geo";
import { groupTrafficPages } from "@/utils/ai-traffic-pages";
import { paginatedTableHeightFor } from "@/utils/table";

const PAGE_SKELETON_ROWS = 4;
const PAGE_COLUMN_WIDTH = "32rem";
const SOURCE_COLUMN_WIDTH = "1fr";
const VISITS_COLUMN_WIDTH = "9.5rem";

export function TrafficPagesCard({
  pages,
  isPending = false,
}: TrafficPagesCardProps) {
  const groups = groupTrafficPages(pages);
  const pagination = useTablePagination({
    key: GEO_TRAFFIC_PAGES_PAGE_PARAM,
    totalItems: groups.length,
    isReady: !isPending,
  });
  const columns: TableColumn<GeoTrafficPageGroup>[] = [
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
      key: "sources",
      header: "Sources",
      width: SOURCE_COLUMN_WIDTH,
      sortable: true,
      cell: (row) => <TrafficPageSourcesCell group={row} />,
      sortValue: (row) =>
        row.sources.length === 1 && row.sources[0]
          ? formatGeoSource(row.sources[0].source)
          : `~${String(row.sources.length).padStart(3, "0")}`,
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
            <GeoStatDelta delta={delta} />
            <span className="text-sm tabular-nums">
              {row.visits.toLocaleString()}
            </span>
          </span>
        );
      },
    },
  ];

  let body: ReactNode;
  if (isPending) {
    body = <GeoTableSkeleton rows={PAGE_SKELETON_ROWS} />;
  } else if (groups.length === 0) {
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
          data={groups}
          defaultSort={{ key: "visits", direction: "desc" }}
          emptyState="No AI visits captured yet"
          footer={<TablePagination {...pagination} itemLabel="pages" />}
          getRowId={(row) => row.path}
          height={paginatedTableHeightFor(pagination.pageRowCount)}
          onSortChange={() => pagination.setPage(1)}
          page={pagination.page}
          pageSize={pagination.pageSize}
          resizable
          rowHeight={TABLE_ROW_HEIGHT}
        />
      </div>
    );
  }

  return (
    <InstrumentSection
      eyebrow={
        groups.length > 0
          ? `Top pages by AI source (${groups.length.toLocaleString()})`
          : "Top pages by AI source"
      }
    >
      {body}
    </InstrumentSection>
  );
}
