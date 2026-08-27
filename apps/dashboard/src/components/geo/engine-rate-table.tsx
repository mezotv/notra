"use client";

import { useMemo, useState } from "react";

import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { EngineFamilySheet } from "@/components/geo/engine-family-sheet";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoBar } from "@/components/geo/geo-bar";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { EMPTY_STATE_TABLE_COLUMNS } from "@/constants/empty-state";
import {
  GEO_EMPTY_PROMPT_RESULTS,
  GEO_EMPTY_TIMESERIES,
} from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import type { EngineRateTableProps, GeoEngineFamily } from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import {
  engineFamilyAvgPosition,
  engineFamilyLabel,
  engineFamilyLastCheckedAt,
  engineFamilyTotals,
  formatMentionRate,
  groupEngineFamilies,
} from "@/utils/geo-charts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";
import { tableHeightFor } from "@/utils/table";

const NOT_SCANNED_RATE = -1;

function RateCell({ family }: { family: GeoEngineFamily }) {
  const totals = engineFamilyTotals(family);
  if (!totals) {
    return <span className="text-muted-foreground text-xs">Not scanned</span>;
  }

  return (
    <span className="flex items-center gap-2">
      <GeoBar className="w-24 shrink-0" value={totals.rate} />
      <span className="text-sm tabular-nums">
        {formatMentionRate(totals.rate)}
      </span>
    </span>
  );
}

function lastCheckedOf(family: GeoEngineFamily): string {
  const value = engineFamilyLastCheckedAt(family);
  return value ? formatAiTrafficTimestamp(value) : "-";
}

function avgPositionOf(family: GeoEngineFamily): string {
  const position = engineFamilyAvgPosition(family);
  return position === null ? "-" : `#${position}`;
}

export function EngineRateTable({
  engines,
  timeseriesPoints = GEO_EMPTY_TIMESERIES,
  promptResults = GEO_EMPTY_PROMPT_RESULTS,
  isScanning = false,
}: EngineRateTableProps) {
  const families = useMemo(() => groupEngineFamilies(engines), [engines]);
  const [selected, setSelected] = useState<GeoEngineFamily | null>(null);

  const columns = useMemo<TableColumn<GeoEngineFamily>[]>(
    () => [
      {
        key: "family",
        header:
          families.length > 0
            ? `Engine (${families.length.toLocaleString()})`
            : "Engine",
        width: "1fr",
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
        width: "1.4fr",
        sortable: true,
        cell: (row) => <RateCell family={row} />,
        sortValue: (row) => engineFamilyTotals(row)?.rate ?? NOT_SCANNED_RATE,
      },
      {
        key: "avgPosition",
        header: "Avg position",
        width: "8.5rem",
        sortable: true,
        cell: (row) => (
          <span className="text-sm tabular-nums">{avgPositionOf(row)}</span>
        ),
        sortValue: (row) =>
          engineFamilyAvgPosition(row) ?? Number.MAX_SAFE_INTEGER,
      },
      {
        key: "lastChecked",
        header: "Last checked",
        width: "9.375rem",
        cell: (row) => (
          <span className="text-muted-foreground text-[0.6875rem] whitespace-nowrap tabular-nums">
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
    <InstrumentSection
      className="h-full"
      eyebrow="Mention rate by engine"
      readout={readout}
    >
      {families.length === 0 ? (
        <InstrumentEmpty
          busy={isScanning}
          className="h-40"
          message={geoScanEmptyMessage(
            isScanning,
            "Run a scan to see engine mention rates"
          )}
          preview={
            <div className="px-6 pt-2">
              <EmptyStateTablePreview
                columns={EMPTY_STATE_TABLE_COLUMNS.engines}
                rows={3}
              />
            </div>
          }
          seed="Mention rate by engine"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Table
            className="rounded-2xl"
            columns={columns}
            data={families}
            defaultSort={{ key: "rate", direction: "desc" }}
            emptyState="No engines scanned yet"
            getRowId={(row) => row.family}
            height={tableHeightFor(families.length)}
            onRowClick={setSelected}
            resizable
            rowHeight={TABLE_ROW_HEIGHT}
          />
        </div>
      )}
      <EngineFamilySheet
        family={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
        open={selected !== null}
        promptResults={promptResults}
        timeseriesPoints={timeseriesPoints}
      />
    </InstrumentSection>
  );
}
