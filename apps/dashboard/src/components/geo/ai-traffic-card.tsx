"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoBar } from "@/components/geo/geo-bar";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type {
  AiTrafficCardProps,
  GeoTrafficSource,
  GeoTrafficTotals,
} from "@/types/geo";
import {
  formatAiTrafficTimestamp,
  formatGeoSource,
  formatMarkdownShare,
} from "@/utils/ai-traffic";
import { tableHeightFor } from "@/utils/table";

function TrafficTotals({
  totals,
  markdownTotal,
}: {
  totals: GeoTrafficTotals;
  markdownTotal: number;
}) {
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
    {
      label: "Markdown requests",
      value: markdownTotal,
      hint: "agents asking for text/markdown",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {tiles.map((tile) => (
        <div className="space-y-1" key={tile.label}>
          <p className="font-medium text-muted-foreground text-sm">
            {tile.label}
          </p>
          <p className="font-bold text-3xl tabular-nums">
            {tile.value.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-xs">{tile.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function AiTrafficCard({ traffic }: AiTrafficCardProps) {
  const sources = traffic?.sources ?? [];
  const totals = traffic?.totals ?? { crawler: 0, aiReferral: 0, human: 0 };
  const markdownTotal = sources.reduce(
    (sum, source) => sum + source.markdownVisits,
    0
  );
  const maxVisits = sources.reduce(
    (max, source) => Math.max(max, source.visits),
    0
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
            <GeoBar
              className="w-24 shrink-0"
              fillClassName="rounded-full"
              max={maxVisits}
              value={row.visits}
            />
            <span className="text-sm tabular-nums">
              {row.visits.toLocaleString()}
            </span>
          </span>
        ),
      },
      {
        key: "markdownVisits",
        header: "Markdown",
        width: "8rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="tabular-nums">
                    {row.markdownVisits > 0
                      ? formatMarkdownShare(row.markdownVisits, row.visits)
                      : "-"}
                  </span>
                }
              />
              <TooltipContent>
                {row.markdownVisits.toLocaleString()} of{" "}
                {row.visits.toLocaleString()} requests asked for markdown via
                the Accept header
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        sortValue: (row) =>
          row.visits === 0 ? 0 : row.markdownVisits / row.visits,
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
    <InstrumentSection
      eyebrow="AI traffic to your site"
      readout={
        sources.length > 0
          ? `${totalVisits.toLocaleString()} visits · ${sources.length.toLocaleString()} sources · 30D`
          : "crawlers and assistants reaching your pages"
      }
    >
      {sources.length === 0 ? (
        <InstrumentEmpty
          message="No AI traffic captured yet"
          seed="geo-traffic-sources"
        />
      ) : (
        <div className="space-y-4">
          <TrafficTotals markdownTotal={markdownTotal} totals={totals} />
          <div className="flex flex-col gap-2">
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
    </InstrumentSection>
  );
}
