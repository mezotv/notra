"use client";

import { SourceCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  HoverCard,
  HoverCardTrigger,
} from "@notra/ui/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";

import { EngineIcon } from "@/components/geo/engine-icon";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import { TrafficBreakdownCard } from "@/components/geo/traffic-breakdown-card";
import { CountryFlag } from "@/components/geo/twemoji";
import { Table, type TableColumn } from "@/components/motion/table";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import {
  AI_TRAFFIC_PURPOSE_LABELS,
  GEO_CITATIONS_ROW_HEIGHT,
} from "@/constants/geo";
import { GEO_TRAFFIC_HOVER_DELAY_MS } from "@/constants/geo-traffic-hover";
import type { CitationsTableProps, GeoTrafficLogEntry } from "@/types/geo";
import { countryName } from "@/utils/country";
import {
  citationProviderTooltip,
  citationRowId,
  formatCitationProvider,
  formatCitationTimestamp,
} from "@/utils/geo-citations";

function ProviderCell({ entry }: { entry: GeoTrafficLogEntry }) {
  const detail = citationProviderTooltip(entry);
  const engine = entry.agent || entry.source;
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={GEO_TRAFFIC_HOVER_DELAY_MS}
        render={
          <button
            aria-label={`${detail.title}, show details`}
            className="focus-visible:ring-ring/50 inline-flex max-w-full min-w-0 cursor-default items-center gap-2 rounded-sm text-left outline-hidden focus-visible:ring-[3px]"
            type="button"
          />
        }
      >
        <EngineIcon engine={engine} />
        <span className="truncate">{detail.title}</span>
      </HoverCardTrigger>
      <TrafficBreakdownCard
        aside={
          detail.raw ? (
            <span className="block max-w-32 truncate font-mono">
              {detail.raw}
            </span>
          ) : null
        }
        icon={<EngineIcon engine={engine} />}
        title={detail.title}
      >
        <dl className="flex flex-col">
          <div className="flex items-center justify-between gap-3 px-3 py-1.5">
            <dt className="text-muted-foreground text-xs">Purpose</dt>
            <dd className="m-0 text-xs font-medium">{detail.purpose}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-1.5">
            <dt className="text-muted-foreground text-xs">Confidence</dt>
            <dd className="m-0 text-xs font-medium">{detail.confidence}</dd>
          </div>
        </dl>
      </TrafficBreakdownCard>
    </HoverCard>
  );
}

function MarkdownFlag({ wantsMarkdown }: { wantsMarkdown: boolean }) {
  if (!wantsMarkdown) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex shrink-0 cursor-help" />}
      >
        <Badge aria-label="Markdown" className="px-1.5" variant="secondary">
          <HugeiconsIcon
            className="size-3 shrink-0"
            icon={SourceCodeIcon}
            strokeWidth={2}
          />
        </Badge>
      </TooltipTrigger>
      <TooltipContent align="start" className="max-w-xs text-pretty">
        <span className="block font-medium">Markdown</span>
        Asked for markdown via the Accept header
      </TooltipContent>
    </Tooltip>
  );
}

const CITATIONS_COLUMNS: TableColumn<GeoTrafficLogEntry>[] = [
  {
    key: "capturedAt",
    header: "When",
    width: "10.5rem",
    sortable: true,
    sortValue: (entry) => entry.capturedAt,
    cell: (entry) => (
      <span className="text-muted-foreground text-[0.6875rem] whitespace-nowrap tabular-nums">
        {formatCitationTimestamp(entry.capturedAt)}
      </span>
    ),
  },
  {
    key: "source",
    header: "Provider",
    width: "11rem",
    sortable: true,
    sortValue: (entry) =>
      formatCitationProvider(entry.agent, entry.source, entry.visitorType),
    cell: (entry) => (
      <span className="text-sm font-medium">
        <ProviderCell entry={entry} />
      </span>
    ),
  },
  {
    key: "path",
    header: "Path",
    width: "1fr",
    cell: (entry) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1">
          <TruncateWithTooltip className="font-mono text-xs">
            {entry.path}
          </TruncateWithTooltip>
        </span>
      </span>
    ),
  },
  {
    key: "category",
    header: "Purpose",
    width: "6.5rem",
    sortable: true,
    sortValue: (entry) =>
      AI_TRAFFIC_PURPOSE_LABELS[entry.category] ?? entry.category,
    cell: (entry) => (
      <span className="flex items-center gap-1">
        <PurposeBadge category={entry.category} compact />
        <MarkdownFlag wantsMarkdown={entry.wantsMarkdown} />
      </span>
    ),
  },
  {
    key: "country",
    header: "Country",
    width: "10.5rem",
    sortable: true,
    sortValue: (row) => countryName(row.country),
    cell: (row) =>
      row.country ? (
        <span className="flex min-w-0 items-center gap-2">
          <CountryFlag className="size-4 shrink-0" code={row.country} />
          <span className="truncate">{countryName(row.country)}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
];

const CITATIONS_DEFAULT_SORT = {
  key: "capturedAt",
  direction: "desc",
} as const;

export function CitationsTable({
  entries,
  height,
  loading = false,
}: CitationsTableProps) {
  return (
    <Table
      className="rounded-2xl"
      columns={CITATIONS_COLUMNS}
      data={entries}
      defaultSort={CITATIONS_DEFAULT_SORT}
      getRowId={citationRowId}
      height={height}
      loading={loading}
      resizable
      rowHeight={GEO_CITATIONS_ROW_HEIGHT}
    />
  );
}
