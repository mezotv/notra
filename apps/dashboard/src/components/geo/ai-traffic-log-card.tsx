"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useState } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import { CountryFlag } from "@/components/geo/twemoji";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  AI_TRAFFIC_CONFIDENCE_LABELS,
  AI_TRAFFIC_PURPOSE_LABELS,
  GEO_TRAFFIC_LOG_PURPOSE_OPTIONS,
  GEO_TRAFFIC_LOG_VISITOR_OPTIONS,
} from "@/constants/geo";
import { useGeoTrafficLog } from "@/lib/hooks/use-geo";
import type {
  AiTrafficLogCardProps,
  GeoTrafficLogEntry,
  GeoTrafficLogFilters,
} from "@/types/geo";
import {
  formatAiTrafficTimestamp,
  formatGeoSource,
  formatGeoTrafficFilterLabel,
  toggleGeoTrafficFilterValue,
} from "@/utils/ai-traffic";
import { countryName } from "@/utils/country";

function SourceCell({ entry }: { entry: GeoTrafficLogEntry }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex cursor-default items-center gap-2" />
        }
      >
        <EngineIcon engine={entry.source} />
        {formatGeoSource(entry.source, entry.visitorType)}
      </TooltipTrigger>
      <TooltipContent>
        <span className="block font-mono">{entry.agent || entry.source}</span>
        <span className="block text-muted-foreground">
          {AI_TRAFFIC_PURPOSE_LABELS[entry.category] ?? entry.category}
        </span>
        <span className="block text-muted-foreground">
          {AI_TRAFFIC_CONFIDENCE_LABELS[entry.confidence] ?? entry.confidence}
        </span>
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
          <span className="cursor-default rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground" />
        }
      >
        MD
      </TooltipTrigger>
      <TooltipContent>Requested markdown (Accept header)</TooltipContent>
    </Tooltip>
  );
}

const TRAFFIC_LOG_COLUMNS: TableColumn<GeoTrafficLogEntry>[] = [
  {
    key: "capturedAt",
    header: "Time",
    width: "7rem",
    sortable: true,
    sortValue: (entry) => entry.capturedAt,
    cell: (entry) => (
      <span className="whitespace-nowrap text-[0.6875rem] text-muted-foreground tabular-nums">
        {formatAiTrafficTimestamp(entry.capturedAt)}
      </span>
    ),
  },
  {
    key: "source",
    header: "Source",
    width: "10rem",
    sortable: true,
    sortValue: (entry) => formatGeoSource(entry.source, entry.visitorType),
    cell: (entry) => (
      <span className="font-medium text-sm">
        <SourceCell entry={entry} />
      </span>
    ),
  },
  {
    key: "category",
    header: "Purpose",
    width: "8.5rem",
    sortable: true,
    sortValue: (entry) =>
      AI_TRAFFIC_PURPOSE_LABELS[entry.category] ?? entry.category,
    cell: (entry) => <PurposeBadge category={entry.category} />,
  },
  {
    key: "path",
    header: "Path",
    width: "18rem",
    cell: (entry) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-mono text-xs" title={entry.path}>
          {entry.path}
        </span>
        <MarkdownFlag wantsMarkdown={entry.wantsMarkdown} />
      </span>
    ),
  },
  {
    key: "country",
    header: "Country",
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

const TRAFFIC_LOG_DEFAULT_SORT = {
  key: "capturedAt",
  direction: "desc",
} as const;

const TRAFFIC_LOG_ROW_HEIGHT = 40;
const TRAFFIC_LOG_HEIGHT = 416;

const FILTER_TRIGGER_CLASS =
  "flex h-6 items-center gap-1 rounded-sm border border-border bg-background px-2 text-xs hover:bg-muted";

export function AiTrafficLogCard({ organizationId }: AiTrafficLogCardProps) {
  const [filters, setFilters] = useState<GeoTrafficLogFilters>({
    visitorTypes: [],
    categories: [],
  });
  const { data } = useGeoTrafficLog(organizationId, filters);
  const log = data?.log ?? [];

  const filterRow = (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger className={FILTER_TRIGGER_CLASS}>
          {formatGeoTrafficFilterLabel(
            "All visitors",
            "visitors",
            filters.visitorTypes,
            GEO_TRAFFIC_LOG_VISITOR_OPTIONS
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {GEO_TRAFFIC_LOG_VISITOR_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              checked={filters.visitorTypes.includes(option.value)}
              key={option.value}
              onCheckedChange={() => {
                setFilters((previous) => ({
                  ...previous,
                  visitorTypes: toggleGeoTrafficFilterValue(
                    previous.visitorTypes,
                    option.value
                  ),
                }));
              }}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger className={FILTER_TRIGGER_CLASS}>
          {formatGeoTrafficFilterLabel(
            "All purposes",
            "purposes",
            filters.categories,
            GEO_TRAFFIC_LOG_PURPOSE_OPTIONS
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {GEO_TRAFFIC_LOG_PURPOSE_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              checked={filters.categories.includes(option.value)}
              key={option.value}
              onCheckedChange={() => {
                setFilters((previous) => ({
                  ...previous,
                  categories: toggleGeoTrafficFilterValue(
                    previous.categories,
                    option.value
                  ),
                }));
              }}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <InstrumentSection
      action={filterRow}
      eyebrow="Tracking log"
      readout={log.length === 0 ? "no visits yet" : `last ${log.length} visits`}
    >
      {log.length === 0 ? (
        <InstrumentEmpty
          message="No visits match these filters"
          seed="geo-traffic-log"
        />
      ) : (
        <Table
          className="rounded-2xl"
          columns={TRAFFIC_LOG_COLUMNS}
          data={log}
          defaultSort={TRAFFIC_LOG_DEFAULT_SORT}
          getRowId={(entry, index) =>
            `${entry.capturedAt}-${entry.source}-${entry.path}-${index}`
          }
          height={TRAFFIC_LOG_HEIGHT}
          resizable
          rowHeight={TRAFFIC_LOG_ROW_HEIGHT}
        />
      )}
    </InstrumentSection>
  );
}
