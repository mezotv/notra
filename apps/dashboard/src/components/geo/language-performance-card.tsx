"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/button";
import { GeoBar } from "@/components/geo/geo-bar";
import { GeoLanguagesDialog } from "@/components/geo/geo-languages-dialog";
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
import { geoScanEmptyMessage } from "@/utils/geo-scan";
import { tableHeightFor } from "@/utils/table";

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
        <GeoBar
          className="h-2 max-w-40"
          fillClassName={
            row.language === BASELINE_LANGUAGE ? "bg-chart-2" : "bg-chart-1"
          }
          value={row.mentionRate}
        />
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

function LanguageScanEmpty({ isScanning }: { isScanning: boolean }) {
  return (
    <InstrumentEmpty
      busy={isScanning}
      className="flex-1"
      message={geoScanEmptyMessage(
        isScanning,
        "Run a scan to see how engines answer beyond English"
      )}
      seed="Performance by language"
    />
  );
}

function LanguageAddEmpty({ onAddLanguages }: { onAddLanguages: () => void }) {
  return (
    <InstrumentEmpty
      action={
        <Button onClick={onAddLanguages} size="sm" type="button">
          <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
          Add languages
        </Button>
      }
      className="flex-1"
      message="See how engines answer beyond English"
      seed="Performance by language"
    />
  );
}

function LanguagePerformanceBody({
  hasExtraLanguages,
  isScanning,
  onAddLanguages,
  points,
}: {
  hasExtraLanguages: boolean;
  isScanning: boolean;
  onAddLanguages: () => void;
  points: GeoLanguageSharePoint[];
}) {
  if (hasExtraLanguages && points.length > 0) {
    return (
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
    );
  }

  if (hasExtraLanguages) {
    return <LanguageScanEmpty isScanning={isScanning} />;
  }

  return <LanguageAddEmpty onAddLanguages={onAddLanguages} />;
}

export function LanguagePerformanceCard({
  points,
  organizationId,
  settings,
  isScanning = false,
}: LanguagePerformanceCardProps) {
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const hasExtraLanguages =
    settings.languages.length > 0 ||
    points.some((point) => point.language !== BASELINE_LANGUAGE);

  return (
    <>
      <InstrumentSection
        bodyClassName="flex flex-col"
        className="flex-1"
        eyebrow="Performance by language"
        readout={points.length > 0 ? "30D" : undefined}
      >
        <LanguagePerformanceBody
          hasExtraLanguages={hasExtraLanguages}
          isScanning={isScanning}
          onAddLanguages={() => setLanguagesOpen(true)}
          points={points}
        />
      </InstrumentSection>
      <GeoLanguagesDialog
        companyName={settings.companyName}
        enabled={settings.enabled}
        onOpenChange={setLanguagesOpen}
        open={languagesOpen}
        organizationId={organizationId}
        settings={settings}
      />
    </>
  );
}
