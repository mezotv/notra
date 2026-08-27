"use client";

import { useMemo, useState } from "react";

import { EngineIcon } from "@/components/geo/engine-icon";
import { JourneyDetailDialog } from "@/components/geo/journey-detail-dialog";
import { JourneyPathTrail } from "@/components/geo/journey-path-trail";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_JOURNEY_TRAIL_TABLE_LIMIT } from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoJourney, JourneysCardProps } from "@/types/geo";
import {
  formatAiTrafficTimestamp,
  formatGeoJourneyChip,
  formatGeoJourneySpan,
  formatGeoSource,
} from "@/utils/ai-traffic";
import { tableHeightFor } from "@/utils/table";

export function JourneysCard({ journeys, organizationId }: JourneysCardProps) {
  const [selected, setSelected] = useState<GeoJourney | null>(null);

  const columns = useMemo<TableColumn<GeoJourney>[]>(
    () => [
      {
        key: "journeyId",
        header: "Journey",
        width: "7.5rem",
        cell: (row) => (
          <span
            className="bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 font-mono text-xs"
            title={row.journeyId}
          >
            {formatGeoJourneyChip(row.journeyId)}
          </span>
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
            <span className="truncate">
              {formatGeoSource(row.source, row.visitorType)}
            </span>
          </span>
        ),
        sortValue: (row) => formatGeoSource(row.source, row.visitorType),
      },
      {
        key: "pages",
        header: "Pages",
        width: "5.625rem",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{row.pages}</span>
        ),
      },
      {
        key: "distinctPaths",
        header: "Unique",
        width: "5.625rem",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{row.distinctPaths}</span>
        ),
      },
      {
        key: "span",
        header: "Span",
        width: "9.5rem",
        cell: (row) => (
          <span className="text-muted-foreground text-[0.6875rem] whitespace-nowrap tabular-nums">
            {formatGeoJourneySpan(row.firstSeenAt, row.lastSeenAt)}
          </span>
        ),
      },
      {
        key: "lastSeenAt",
        header: "Last seen",
        width: "9.375rem",
        sortable: true,
        cell: (row) => (
          <span className="text-muted-foreground text-[0.6875rem] whitespace-nowrap tabular-nums">
            {formatAiTrafficTimestamp(row.lastSeenAt)}
          </span>
        ),
      },
      {
        key: "entryPath",
        header: "Path",
        width: "2fr",
        cell: (row) => (
          <JourneyPathTrail
            className="flex-nowrap overflow-hidden"
            limit={GEO_JOURNEY_TRAIL_TABLE_LIMIT}
            paths={row.samplePaths}
          />
        ),
        sortValue: (row) => row.samplePaths[0] ?? "",
      },
    ],
    []
  );

  return (
    <InstrumentSection
      eyebrow="Agent journeys"
      readout={
        journeys.length > 0
          ? `${journeys.length.toLocaleString()} captured`
          : "no journeys yet"
      }
    >
      {journeys.length === 0 ? (
        <InstrumentEmpty
          message="No agent journeys captured yet"
          seed="geo-journeys"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Table
            className="rounded-2xl"
            columns={columns}
            data={journeys}
            defaultSort={{ key: "lastSeenAt", direction: "desc" }}
            emptyState="No agent journeys captured yet"
            getRowId={(row) => row.journeyId}
            height={tableHeightFor(journeys.length)}
            onRowClick={setSelected}
            resizable
            rowHeight={TABLE_ROW_HEIGHT}
          />
        </div>
      )}
      <JourneyDetailDialog
        journey={selected}
        onOpenChange={(next) => {
          if (!next) {
            setSelected(null);
          }
        }}
        open={selected !== null}
        organizationId={organizationId}
      />
    </InstrumentSection>
  );
}
