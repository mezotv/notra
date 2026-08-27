"use client";

import { useMemo, useState } from "react";

import { EngineFamilySheet } from "@/components/geo/engine-family-sheet";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoBar } from "@/components/geo/geo-bar";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import {
  GEO_EMPTY_PROMPT_RESULTS,
  GEO_EMPTY_TIMESERIES,
} from "@/constants/geo";
import type { GeoEngineFamily, MentionRateCardProps } from "@/types/geo";
import {
  engineFamilyAvgPosition,
  engineFamilyLabel,
  engineFamilyTotals,
  formatMentionRate,
  groupEngineFamilies,
} from "@/utils/geo-charts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

function FamilyRate({
  family,
  onOpen,
}: {
  family: GeoEngineFamily;
  onOpen: () => void;
}) {
  const name = engineFamilyLabel(family.family);
  const totals = engineFamilyTotals(family);
  const position = engineFamilyAvgPosition(family);
  if (!totals) {
    return null;
  }

  return (
    <button
      aria-label={`Open ${name} mention breakdown`}
      className="hover:bg-muted/60 space-y-1.5 rounded-lg p-1.5 text-left transition-colors"
      onClick={onOpen}
      type="button"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium">
          <EngineIcon engine={family.family} />
          <span className="truncate">{name}</span>
        </span>
        {position === null ? null : (
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            avg position {position}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <GeoBar className="h-2 w-auto flex-1" value={totals.rate} />
        <span className="w-24 shrink-0 text-right text-xs tabular-nums">
          <span className="text-foreground text-sm">
            {formatMentionRate(totals.rate)}
          </span>{" "}
          <span className="text-muted-foreground">
            {totals.mentions}/{totals.checks}
          </span>
        </span>
      </div>
    </button>
  );
}

export function MentionRateCard({
  engines,
  timeseriesPoints = GEO_EMPTY_TIMESERIES,
  promptResults = GEO_EMPTY_PROMPT_RESULTS,
  isScanning = false,
}: MentionRateCardProps) {
  const families = useMemo(() => groupEngineFamilies(engines), [engines]);
  const [selected, setSelected] = useState<GeoEngineFamily | null>(null);

  return (
    <InstrumentModule eyebrow="Mention rate" readout="30D">
      {families.length === 0 ? (
        <InstrumentEmpty
          busy={isScanning}
          className="h-40"
          message={geoScanEmptyMessage(isScanning, "No scans yet")}
          seed="Mention rate"
        />
      ) : (
        <div className="grid content-start gap-x-8 gap-y-2 sm:grid-cols-2">
          {families.map((family) => (
            <FamilyRate
              family={family}
              key={family.family}
              onOpen={() => setSelected(family)}
            />
          ))}
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
    </InstrumentModule>
  );
}
