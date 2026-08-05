"use client";

import { useMemo } from "react";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import { Table, type TableColumn } from "@/components/motion/table";
import { GEO_LANGUAGE_FLAGS } from "@/constants/geo";
import { TABLE_ROW_HEIGHT } from "@/constants/table";
import { cn } from "@/lib/utils";
import type {
  GeoLanguageSharePoint,
  LanguagePerformanceCardProps,
} from "@/types/geo";
import { formatMentionRate } from "@/utils/geo-charts";
import { tableHeightFor } from "@/utils/table";

const PERCENT = 100;
const MIN_BAR_PERCENT = 2;
const BASELINE_LANGUAGE = "English";

export function LanguagePerformanceCard({
  points,
  configuredLanguages,
}: LanguagePerformanceCardProps) {
  const hasExtraLanguages =
    configuredLanguages.length > 0 ||
    points.some((point) => point.language !== BASELINE_LANGUAGE);

  const columns = useMemo<TableColumn<GeoLanguageSharePoint>[]>(
    () => [
      {
        key: "language",
        header: "Language",
        width: "1.2fr",
        sortable: true,
        cell: (row) => (
          <span className="flex min-w-0 items-center gap-1.5 text-sm">
            <span aria-hidden="true">{GEO_LANGUAGE_FLAGS[row.language]}</span>
            <span
              className={cn(
                "truncate",
                row.language === BASELINE_LANGUAGE
                  ? "text-foreground/70"
                  : "font-medium"
              )}
            >
              {row.language}
            </span>
          </span>
        ),
      },
      {
        key: "mentionRateBar",
        header: "Mention rate",
        width: "1.6fr",
        cell: (row) => (
          <span className="block h-2 w-full overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "block h-full",
                row.language === BASELINE_LANGUAGE ? "bg-chart-2" : "bg-chart-1"
              )}
              style={{
                width: `${Math.max(Math.round(row.mentionRate * PERCENT), MIN_BAR_PERCENT)}%`,
              }}
            />
          </span>
        ),
        sortValue: (row) => row.mentionRate,
      },
      {
        key: "mentionRate",
        header: "Rate",
        width: "5.625rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-xs tabular-nums">
            {formatMentionRate(row.mentionRate)}
          </span>
        ),
      },
      {
        key: "checks",
        header: "Checks",
        width: "8.75rem",
        align: "right",
        sortable: true,
        cell: (row) => (
          <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
            {row.mentions}/{row.checks} checks
          </span>
        ),
      },
    ],
    []
  );

  return (
    <InstrumentSection eyebrow="Performance by language" readout="30D">
      {hasExtraLanguages && points.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
            <span>{points.length.toLocaleString()} languages</span>
          </div>
          <Table
            className="rounded-2xl"
            columns={columns}
            data={points}
            defaultSort={{ key: "mentionRate", direction: "desc" }}
            emptyState="No language results yet"
            getRowId={(row) => row.language}
            height={tableHeightFor(points.length)}
            resizable
            rowHeight={TABLE_ROW_HEIGHT}
          />
        </div>
      ) : (
        <InstrumentEmpty
          className="h-40"
          message="Add languages in settings to see how engines answer beyond English"
          seed="Performance by language"
        />
      )}
    </InstrumentSection>
  );
}
