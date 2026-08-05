"use client";

import { useMemo, useState } from "react";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { EngineIcon } from "@/components/geo/engine-icon";
import { JourneyDetailDialog } from "@/components/geo/journey-detail-dialog";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { GeoJourney, JourneysCardProps } from "@/types/geo";
import {
  formatAiTrafficTimestamp,
  formatGeoJourneyChip,
  formatGeoJourneySpan,
  formatGeoSource,
} from "@/utils/ai-traffic";
import { buildJourneyDepthFunnel } from "@/utils/geo-journey";
import { tableHeightFor } from "@/utils/table";

export function JourneysCard({ journeys, organizationId }: JourneysCardProps) {
  const [selected, setSelected] = useState<GeoJourney | null>(null);

  const depthStages = useMemo(
    () => buildJourneyDepthFunnel(journeys),
    [journeys]
  );

  const columns = useMemo<TableColumn<GeoJourney>[]>(
    () => [
      {
        key: "journeyId",
        header: "Journey",
        width: "8.75rem",
        cell: (row) => (
          <span
            className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs"
            title={row.journeyId}
          >
            {formatGeoJourneyChip(row.journeyId)}
          </span>
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
        key: "pages",
        header: "Pages",
        width: "5.625rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{row.pages}</span>
        ),
      },
      {
        key: "distinctPaths",
        header: "Unique",
        width: "5.625rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{row.distinctPaths}</span>
        ),
      },
      {
        key: "span",
        header: "Span",
        width: "10.625rem",
        cell: (row) => (
          <span className="whitespace-nowrap text-[0.6875rem] text-muted-foreground tabular-nums">
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
          <span className="whitespace-nowrap text-[0.6875rem] text-muted-foreground tabular-nums">
            {formatAiTrafficTimestamp(row.lastSeenAt)}
          </span>
        ),
      },
      {
        key: "entryPath",
        header: "Entry path",
        width: "1.6fr",
        cell: (row) => (
          <span
            className="block truncate font-mono text-xs"
            title={row.samplePaths.join("\n")}
          >
            {row.samplePaths[0] ?? ""}
          </span>
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
          ? `${journeys.length} journeys · 30D`
          : "no journeys yet"
      }
    >
      {journeys.length === 0 ? (
        <InstrumentEmpty
          message="No agent journeys captured yet"
          seed="geo-journeys"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
              How deep agents crawl before they stop
            </p>
            <FunnelChart
              className="h-40 w-full"
              data={depthStages}
              orientation="horizontal"
              showPercentage
              showValues
            />
          </div>
          <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
            <span>{journeys.length.toLocaleString()} journeys</span>
          </div>
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
