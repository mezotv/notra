"use client";

import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { cn } from "@/lib/utils";
import type {
  EngineRateTableProps,
  GeoEngineFamily,
  GeoOverviewEngine,
} from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import {
  engineFamilyLabel,
  formatMentionRate,
  groupEngineFamilies,
} from "@/utils/geo-charts";
import { tableHeightFor } from "@/utils/table";

const PERCENT = 100;
const MIN_BAR_PERCENT = 2;
const NOT_SCANNED_RATE = -1;

function RateCell({
  engine,
  variant,
}: {
  engine: GeoOverviewEngine | null;
  variant: "web" | "raw";
}) {
  if (!engine) {
    return <span className="text-muted-foreground text-xs">Not scanned</span>;
  }

  const percent = Math.round(engine.mentionRate * PERCENT);

  return (
    <span className="flex items-center gap-2">
      <span className="block h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "block h-full",
            variant === "web" ? "bg-chart-1" : "bg-chart-2"
          )}
          style={{ width: `${Math.max(percent, MIN_BAR_PERCENT)}%` }}
        />
      </span>
      <span className="text-sm tabular-nums">
        {formatMentionRate(engine.mentionRate)}
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">
        {engine.mentions}/{engine.checks}
      </span>
    </span>
  );
}

function lastCheckedOf(family: GeoEngineFamily): string {
  const value = family.web?.lastCheckedAt ?? family.raw?.lastCheckedAt ?? "";
  return value ? formatAiTrafficTimestamp(value) : "-";
}

function avgPositionOf(family: GeoEngineFamily): string {
  const position = family.web?.avgPosition ?? family.raw?.avgPosition ?? null;
  return position === null ? "-" : `#${position}`;
}

export function EngineRateTable({ engines }: EngineRateTableProps) {
  const families = useMemo(() => groupEngineFamilies(engines), [engines]);

  const columns = useMemo<TableColumn<GeoEngineFamily>[]>(
    () => [
      {
        key: "family",
        header: "Engine",
        width: "1.2fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-2 font-medium">
            <EngineIcon engine={row.family} />
            <span className="truncate">{engineFamilyLabel(row.family)}</span>
          </span>
        ),
        sortValue: (row) => engineFamilyLabel(row.family),
      },
      {
        key: "web",
        header: "Web rate",
        width: "1.6fr",
        sortable: true,
        cell: (row) => <RateCell engine={row.web} variant="web" />,
        sortValue: (row) => row.web?.mentionRate ?? NOT_SCANNED_RATE,
      },
      {
        key: "raw",
        header: "Raw rate",
        width: "1.6fr",
        sortable: true,
        cell: (row) => <RateCell engine={row.raw} variant="raw" />,
        sortValue: (row) => row.raw?.mentionRate ?? NOT_SCANNED_RATE,
      },
      {
        key: "avgPosition",
        header: "Avg position",
        width: "7.5rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{avgPositionOf(row)}</span>
        ),
        sortValue: (row) =>
          row.web?.avgPosition ??
          row.raw?.avgPosition ??
          Number.MAX_SAFE_INTEGER,
      },
      {
        key: "lastChecked",
        header: "Last checked",
        width: "9.375rem",
        cell: (row) => (
          <span className="whitespace-nowrap text-[0.6875rem] text-muted-foreground tabular-nums">
            {lastCheckedOf(row)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <InstrumentSection
      eyebrow="Mention rate by engine"
      readout={
        families.length > 0
          ? `${families.length} engines · 30D`
          : "no scans yet"
      }
    >
      {families.length === 0 ? (
        <InstrumentEmpty
          className="h-40"
          message="Run a scan to see engine mention rates"
          seed="Mention rate by engine"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
            <span>{families.length.toLocaleString()} engines</span>
          </div>
          <Table
            className="rounded-2xl"
            columns={columns}
            data={families}
            emptyState="No engines scanned yet"
            getRowId={(row) => row.family}
            height={tableHeightFor(families.length)}
            resizable
            rowHeight={TABLE_ROW_HEIGHT}
          />
        </div>
      )}
    </InstrumentSection>
  );
}
