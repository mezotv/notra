"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useState } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { PurposeBadge } from "@/components/geo/purpose-badge";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  AI_TRAFFIC_CONFIDENCE_LABELS,
  AI_TRAFFIC_PURPOSE_LABELS,
  GEO_JOURNEY_KIND_LABELS,
  GEO_TRAFFIC_LOG_FILTER_ALL,
  GEO_TRAFFIC_LOG_PURPOSE_OPTIONS,
  GEO_TRAFFIC_LOG_VISITOR_OPTIONS,
  GEO_VISITOR_TYPE_LABELS,
} from "@/constants/geo";
import { useGeoTrafficLog } from "@/lib/hooks/use-geo";
import type {
  AiTrafficLogCardProps,
  GeoTrafficLogEntry,
  GeoTrafficLogFilters,
} from "@/types/geo";
import {
  formatAiTrafficTimestamp,
  formatGeoJourneyChip,
  formatGeoSource,
  toGeoJourneyKind,
} from "@/utils/ai-traffic";

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

function JourneyCell({ journeyId }: { journeyId: string }) {
  if (!journeyId) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="cursor-default rounded-sm bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs" />
        }
      >
        {formatGeoJourneyChip(journeyId)}
      </TooltipTrigger>
      <TooltipContent>
        <span className="block font-mono">{journeyId}</span>
        <span className="block text-muted-foreground">
          {GEO_JOURNEY_KIND_LABELS[toGeoJourneyKind(journeyId)]}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function MarkdownCell({ wantsMarkdown }: { wantsMarkdown: boolean }) {
  if (!wantsMarkdown) {
    return <span className="text-muted-foreground text-xs">-</span>;
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
    key: "visitorType",
    header: "Type",
    width: "6.5rem",
    cell: (entry) => (
      <Badge className="rounded-sm text-[0.6875rem]" variant="secondary">
        {GEO_VISITOR_TYPE_LABELS[entry.visitorType] ?? entry.visitorType}
      </Badge>
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
    cell: (entry) => (
      <span className="block truncate font-mono text-xs" title={entry.path}>
        {entry.path}
      </span>
    ),
  },
  {
    key: "wantsMarkdown",
    header: "Markdown",
    width: "6rem",
    cell: (entry) => <MarkdownCell wantsMarkdown={entry.wantsMarkdown} />,
  },
  {
    key: "journeyId",
    header: "Journey",
    width: "7rem",
    cell: (entry) => <JourneyCell journeyId={entry.journeyId} />,
  },
  {
    key: "country",
    header: "Country",
    width: "5.5rem",
    cell: (entry) => (
      <span className="text-[0.6875rem] text-muted-foreground uppercase">
        {entry.country}
      </span>
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
  "h-6 gap-1 rounded-sm border-border px-2 text-xs capitalize data-[size=sm]:h-6";

export function AiTrafficLogCard({ organizationId }: AiTrafficLogCardProps) {
  const [filters, setFilters] = useState<GeoTrafficLogFilters>({
    visitorType: GEO_TRAFFIC_LOG_FILTER_ALL,
    category: GEO_TRAFFIC_LOG_FILTER_ALL,
  });
  const { data } = useGeoTrafficLog(organizationId, filters);
  const log = data?.log ?? [];

  const filterRow = (
    <div className="flex items-center gap-2">
      <Select
        onValueChange={(value) => {
          const option = GEO_TRAFFIC_LOG_VISITOR_OPTIONS.find(
            (item) => item.value === value
          );
          if (option) {
            setFilters((previous) => ({
              ...previous,
              visitorType: option.value,
            }));
          }
        }}
        value={filters.visitorType}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS} size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GEO_TRAFFIC_LOG_VISITOR_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(value) => {
          const option = GEO_TRAFFIC_LOG_PURPOSE_OPTIONS.find(
            (item) => item.value === value
          );
          if (option) {
            setFilters((previous) => ({ ...previous, category: option.value }));
          }
        }}
        value={filters.category}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS} size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GEO_TRAFFIC_LOG_PURPOSE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
