"use client";

import { Twemoji } from "@/components/geo/twemoji";
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

const LANGUAGE_COLUMNS: TableColumn<GeoLanguageSharePoint>[] = [
  {
    key: "language",
    header: "Language",
    width: "1.2fr",
    sortable: true,
    cell: (row) => (
      <span className="flex min-w-0 items-center gap-1.5 text-sm">
        <Twemoji
          className="size-4 shrink-0"
          emoji={GEO_LANGUAGE_FLAGS[row.language] ?? ""}
          label={row.language}
        />
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
    key: "mentionRate",
    header: "Mention rate",
    width: "1.6fr",
    sortable: true,
    sortValue: (row) => row.mentionRate,
    cell: (row) => (
      <span className="flex items-center gap-2">
        <span className="block h-2 w-full max-w-40 overflow-hidden rounded-full bg-muted">
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
        <span className="shrink-0 text-xs tabular-nums">
          {formatMentionRate(row.mentionRate)}
        </span>
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
];

export function LanguagePerformanceCard({
  points,
  configuredLanguages,
}: LanguagePerformanceCardProps) {
  const hasExtraLanguages =
    configuredLanguages.length > 0 ||
    points.some((point) => point.language !== BASELINE_LANGUAGE);

  return (
    <InstrumentSection eyebrow="Performance by language" readout="30D">
      {hasExtraLanguages && points.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Table
            className="rounded-2xl"
            columns={LANGUAGE_COLUMNS}
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
