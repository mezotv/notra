"use client";

import { useMemo } from "react";
import { CodeSnippet } from "@/components/geo/code-snippet";
import { EngineIcon } from "@/components/geo/engine-icon";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type {
  AiTrafficCardProps,
  GeoIngestSetupResponse,
  GeoTrafficSource,
  GeoTrafficTotals,
} from "@/types/geo";
import {
  formatAiTrafficTimestamp,
  formatGeoSource,
  hitBarWidth,
} from "@/utils/ai-traffic";
import { tableHeightFor } from "@/utils/table";

function IngestSetup({ setup }: { setup: GeoIngestSetupResponse | undefined }) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        No AI crawler or AI assistant visit has been captured yet. Install
        @usenotra/geo to start recording requests.
      </p>
      <CodeSnippet
        code={
          setup?.snippet ??
          "// Set GEO_INGEST_SECRET to generate your install snippet"
        }
      />
      {setup?.token ? (
        <p className="break-all text-muted-foreground text-xs">
          <span className="font-medium text-foreground">NOTRA_GEO_TOKEN</span>{" "}
          <span className="font-mono">{setup.token}</span>
        </p>
      ) : null}
    </div>
  );
}

function TrafficTotals({ totals }: { totals: GeoTrafficTotals }) {
  const tiles = [
    {
      label: "AI crawlers",
      value: totals.crawler,
      hint: "bots fetching your pages",
    },
    {
      label: "AI referrals",
      value: totals.aiReferral,
      hint: "people arriving from an AI answer",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {tiles.map((tile) => (
        <div className="space-y-1" key={tile.label}>
          <p className="font-medium text-muted-foreground text-sm">
            {tile.label}
          </p>
          <p className="font-bold text-3xl tabular-nums">{tile.value}</p>
          <p className="text-muted-foreground text-xs">{tile.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function AiTrafficCard({ traffic, setup }: AiTrafficCardProps) {
  const sources = traffic?.sources ?? [];
  const totals = traffic?.totals ?? { crawler: 0, aiReferral: 0, human: 0 };
  const maxVisits = useMemo(
    () => sources.reduce((max, source) => Math.max(max, source.visits), 0),
    [sources]
  );
  const totalVisits = totals.crawler + totals.aiReferral;

  const columns = useMemo<TableColumn<GeoTrafficSource>[]>(
    () => [
      {
        key: "source",
        header: "Source",
        width: "1.4fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2 font-medium text-sm">
            <EngineIcon engine={row.source} />
            <span className="truncate">
              {formatGeoSource(row.source, row.visitorType)}
            </span>
          </span>
        ),
        sortValue: (row) => formatGeoSource(row.source, row.visitorType),
      },
      {
        key: "category",
        header: "Purpose",
        width: "8.75rem",
        sortable: true,
        cell: (row) => <PurposeBadge category={row.category} />,
      },
      {
        key: "visits",
        header: "Visits",
        width: "1.2fr",
        sortable: true,
        cell: (row) => (
          <span className="flex items-center gap-2">
            <span className="block h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-chart-1"
                style={{ width: `${hitBarWidth(row.visits, maxVisits)}%` }}
              />
            </span>
            <span className="text-sm tabular-nums">{row.visits}</span>
          </span>
        ),
      },
      {
        key: "paths",
        header: "Pages",
        width: "5.625rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{row.paths}</span>
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
    ],
    [maxVisits]
  );

  return (
    <InstrumentModule
      eyebrow="AI traffic to your site"
      readout={
        sources.length > 0
          ? `${totalVisits} visits · ${sources.length} sources · 30D`
          : "crawlers and assistants reaching your pages"
      }
    >
      {sources.length === 0 ? (
        <IngestSetup setup={setup} />
      ) : (
        <div className="space-y-4">
          <TrafficTotals totals={totals} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
              <span>{sources.length.toLocaleString()} sources</span>
              <span>{totalVisits.toLocaleString()} visits</span>
            </div>
            <Table
              className="rounded-2xl"
              columns={columns}
              data={sources}
              defaultSort={{ key: "visits", direction: "desc" }}
              emptyState="No AI traffic captured yet"
              getRowId={(row) => `${row.visitorType}-${row.source}`}
              height={tableHeightFor(sources.length)}
              resizable
              rowHeight={TABLE_ROW_HEIGHT}
            />
          </div>
        </div>
      )}
    </InstrumentModule>
  );
}
