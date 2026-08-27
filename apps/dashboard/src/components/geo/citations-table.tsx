"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";

import { EngineIcon } from "@/components/geo/engine-icon";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import { CountryFlag } from "@/components/geo/twemoji";
import { Table, type TableColumn } from "@/components/motion/table";
import { TruncateWithTooltip } from "@/components/truncate-with-tooltip";
import {
  AI_TRAFFIC_PURPOSE_LABELS,
  GEO_CITATIONS_ROW_HEIGHT,
} from "@/constants/geo";
import type { CitationsTableProps, GeoTrafficLogEntry } from "@/types/geo";
import { countryName } from "@/utils/country";
import {
  citationProviderTooltip,
  citationRowId,
  formatCitationProvider,
  formatCitationTimestamp,
} from "@/utils/geo-citations";

function ProviderTooltip({ entry }: { entry: GeoTrafficLogEntry }) {
  const detail = citationProviderTooltip(entry);

  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{detail.title}</p>
        {detail.raw ? (
          <p className="text-muted-foreground font-mono text-[0.6875rem]">
            {detail.raw}
          </p>
        ) : null}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">Purpose</dt>
        <dd className="m-0">{detail.purpose}</dd>
        <dt className="text-muted-foreground">Confidence</dt>
        <dd className="m-0">{detail.confidence}</dd>
      </dl>
    </div>
  );
}

function ProviderCell({ entry }: { entry: GeoTrafficLogEntry }) {
  const label = formatCitationProvider(
    entry.agent,
    entry.source,
    entry.visitorType
  );
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex cursor-default items-center gap-2" />
        }
      >
        <EngineIcon engine={entry.agent || entry.source} />
        <span className="truncate">{label}</span>
      </TooltipTrigger>
      <TooltipContent align="start" className="max-w-xs">
        <ProviderTooltip entry={entry} />
      </TooltipContent>
    </Tooltip>
  );
}

function MarkdownFlag({ wantsMarkdown }: { wantsMarkdown: boolean }) {
  if (!wantsMarkdown) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="bg-muted text-muted-foreground cursor-default rounded-sm px-1.5 py-0.5 font-mono text-[0.6875rem]" />
        }
      >
        MD
      </TooltipTrigger>
      <TooltipContent align="start" className="max-w-xs text-pretty">
        Requested markdown (Accept header)
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
        <MarkdownFlag wantsMarkdown={entry.wantsMarkdown} />
      </span>
    ),
  },
  {
    key: "category",
    header: "Purpose",
    width: "9.5rem",
    sortable: true,
    sortValue: (entry) =>
      AI_TRAFFIC_PURPOSE_LABELS[entry.category] ?? entry.category,
    cell: (entry) => <PurposeBadge category={entry.category} />,
  },
  {
    key: "country",
    header: "Country",
    width: "9rem",
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
