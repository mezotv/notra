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
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_MEMORY_LABEL, GEO_SEARCH_LABEL } from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type {
  EngineRateTableProps,
  GeoEngineFamily,
  GeoOverviewEngine,
} from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import {
  engineFamilyLabel,
  engineFamilyTotals,
  formatMentionRate,
  groupEngineFamilies,
} from "@/utils/geo-charts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";
import { tableHeightFor } from "@/utils/table";

const NOT_SCANNED_RATE = -1;

function BreakdownRow({
  label,
  engine,
  variant,
}: {
  label: string;
  engine: GeoOverviewEngine | null;
  variant: "web" | "raw";
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-muted-foreground">{label}</span>
      {engine ? (
        <>
          <GeoBar
            className="w-24 shrink-0"
            fillClassName={variant === "web" ? "bg-chart-1" : "bg-chart-2"}
            value={engine.mentionRate}
          />
          <span className="tabular-nums">
            {formatMentionRate(engine.mentionRate)}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {engine.mentions}/{engine.checks}
          </span>
        </>
      ) : (
        <span className="text-muted-foreground">Not scanned</span>
      )}
    </span>
  );
}

function RateCell({ family }: { family: GeoEngineFamily }) {
  const totals = engineFamilyTotals(family);
  if (!totals) {
    return <span className="text-muted-foreground text-xs">Not scanned</span>;
  }

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="flex cursor-default items-center gap-2">
              <GeoBar className="w-24 shrink-0" value={totals.rate} />
              <span className="text-sm tabular-nums">
                {formatMentionRate(totals.rate)}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {totals.mentions}/{totals.checks}
              </span>
            </span>
          }
        />
        <TooltipContent className="flex flex-col gap-1.5 text-xs">
          <BreakdownRow
            engine={family.web}
            label={GEO_SEARCH_LABEL}
            variant="web"
          />
          <BreakdownRow
            engine={family.raw}
            label={GEO_MEMORY_LABEL}
            variant="raw"
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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

export function EngineRateTable({
  engines,
  isScanning = false,
}: EngineRateTableProps) {
  const families = useMemo(() => groupEngineFamilies(engines), [engines]);

  const columns = useMemo<TableColumn<GeoEngineFamily>[]>(
    () => [
      {
        key: "family",
        header:
          families.length > 0
            ? `Engine (${families.length.toLocaleString()})`
            : "Engine",
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
        key: "rate",
        header: "Mention rate",
        width: "2fr",
        sortable: true,
        cell: (row) => <RateCell family={row} />,
        sortValue: (row) => engineFamilyTotals(row)?.rate ?? NOT_SCANNED_RATE,
      },
      {
        key: "avgPosition",
        header: "Avg position",
        width: "9.5rem",
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
    [families.length]
  );

  const emptyReadout = isScanning ? "scanning now" : "no scans yet";
  const readout = families.length > 0 ? undefined : emptyReadout;

  return (
    <InstrumentSection eyebrow="Mention rate by engine" readout={readout}>
      {families.length === 0 ? (
        <InstrumentEmpty
          busy={isScanning}
          className="h-40"
          message={geoScanEmptyMessage(
            isScanning,
            "Run a scan to see engine mention rates"
          )}
          seed="Mention rate by engine"
        />
      ) : (
        <div className="flex flex-col gap-2">
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
