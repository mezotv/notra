"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { useMemo } from "react";
import { ChartSparkline } from "@/components/charts/chart-sparkline";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoBar } from "@/components/geo/geo-bar";
import { GeoModeIcon } from "@/components/geo/geo-mode-icon";
import {
  GEO_EMPTY_TIMESERIES,
  GEO_SEARCH_LABEL,
  GEO_SPARKLINE_MIN_POINTS,
  GEO_WITHOUT_SEARCH_LABEL,
} from "@/constants/geo";
import { cn } from "@/lib/utils";
import type {
  EngineFamilySheetProps,
  GeoEngineFamily,
  GeoEngineMode,
  GeoEngineVariant,
  GeoOverviewEngine,
  GeoSparklinePoint,
  GeoTimeseriesPoint,
} from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import { formatSparklineDayLabel } from "@/utils/analytics-charts";
import { geoModeColor, geoModeFillClass } from "@/utils/chart-colors";
import {
  engineFamilyAvgPosition,
  engineFamilyLabel,
  engineFamilyLastCheckedAt,
  engineFamilyTotals,
  engineVariantLabel,
  formatChartPercent,
  formatMentionRate,
  mentionRateSparkline,
} from "@/utils/geo-charts";

function ModeBlock({
  label,
  mode,
  engine,
  data,
  hint,
}: {
  label: string;
  mode: GeoEngineMode;
  engine: GeoOverviewEngine | null;
  data: GeoSparklinePoint[];
  hint: string;
}) {
  const values = useMemo(() => data.map((point) => point.value), [data]);
  const labels = useMemo(
    () => data.map((point) => formatSparklineDayLabel(point.day)),
    [data]
  );

  if (!engine) {
    return null;
  }

  const showSparkline = values.length >= GEO_SPARKLINE_MIN_POINTS;
  const variant = mode === "search" ? "web" : "raw";

  return (
    <section className="space-y-2.5 p-3">
      <div className="flex items-center justify-between gap-3">
        <span
          className="flex items-center gap-1.5 font-medium text-sm"
          title={hint}
        >
          <GeoModeIcon mode={mode} />
          {label}
        </span>
        <span className="text-sm tabular-nums">
          {formatMentionRate(engine.mentionRate)}
          <span className="text-muted-foreground">
            {" "}
            · {engine.mentions}/{engine.checks}
          </span>
        </span>
      </div>
      {showSparkline ? (
        <ChartSparkline
          className="h-12 w-full"
          color={geoModeColor(variant)}
          data={values}
          labels={labels}
          tooltipValueFormatter={formatChartPercent}
        />
      ) : (
        <GeoBar
          fillClassName={cn("rounded-full", geoModeFillClass(variant))}
          value={engine.mentionRate}
        />
      )}
    </section>
  );
}

function FamilyStats({ family }: { family: GeoEngineFamily }) {
  const totals = engineFamilyTotals(family);
  const position = engineFamilyAvgPosition(family);

  return (
    <dl className="grid grid-cols-3 gap-3 border-b px-4 py-3">
      <div className="space-y-0.5">
        <dt className="text-muted-foreground text-xs">Mention rate</dt>
        <dd className="font-medium text-base tabular-nums tracking-tight">
          {totals ? formatMentionRate(totals.rate) : "—"}
        </dd>
      </div>
      <div className="space-y-0.5">
        <dt className="text-muted-foreground text-xs">Mentions</dt>
        <dd className="font-medium text-base tabular-nums tracking-tight">
          {totals ? `${totals.mentions}/${totals.checks}` : "—"}
        </dd>
      </div>
      <div className="space-y-0.5">
        <dt className="text-muted-foreground text-xs">Avg position</dt>
        <dd className="font-medium text-base tabular-nums tracking-tight">
          {position === null ? "—" : `#${position}`}
        </dd>
      </div>
    </dl>
  );
}

function VariantModes({
  familyKey,
  familyName,
  variant,
  timeseriesPoints,
  heading,
}: {
  familyKey: string;
  familyName: string;
  variant: GeoEngineVariant;
  timeseriesPoints: readonly GeoTimeseriesPoint[];
  heading: string | null;
}) {
  const searchSparkline = mentionRateSparkline(timeseriesPoints, {
    family: familyKey,
    model: variant.model,
    mode: "search",
  });
  const plainSparkline = mentionRateSparkline(timeseriesPoints, {
    family: familyKey,
    model: variant.model,
    mode: "memory",
  });
  const memoryLabel = heading ? GEO_WITHOUT_SEARCH_LABEL : familyName;
  const searchOnlyNote =
    variant.web && !variant.raw
      ? `${heading ?? familyName} only answers with search, so there is no second mode.`
      : null;

  return (
    <section className="space-y-2">
      {heading ? (
        <h3 className="px-0.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {heading}
        </h3>
      ) : null}
      <div className="divide-y overflow-hidden rounded-lg border">
        <ModeBlock
          data={searchSparkline}
          engine={variant.web}
          hint="Answers with live web"
          label={GEO_SEARCH_LABEL}
          mode="search"
        />
        <ModeBlock
          data={plainSparkline}
          engine={variant.raw}
          hint="Answers without search"
          label={memoryLabel}
          mode="memory"
        />
        {searchOnlyNote ? (
          <p className="px-3 py-2.5 text-muted-foreground text-xs">
            {searchOnlyNote}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function EngineFamilySheet({
  family,
  timeseriesPoints = GEO_EMPTY_TIMESERIES,
  open,
  onOpenChange,
}: EngineFamilySheetProps) {
  const name = family ? engineFamilyLabel(family.family) : "";
  const showVariantHeadings = (family?.variants.length ?? 0) > 1;
  const lastChecked = family ? engineFamilyLastCheckedAt(family) : null;
  let description = showVariantHeadings
    ? "How each model mentions you"
    : "How this engine mentions you";
  if (lastChecked) {
    description = `Last checked ${formatAiTrafficTimestamp(lastChecked)}`;
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="gap-0 overflow-hidden rounded-xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:border sm:max-w-md">
        {family ? (
          <>
            <SheetHeader className="border-b bg-muted/50 pr-14">
              <SheetTitle className="flex items-center gap-2">
                <EngineIcon className="size-5" engine={family.family} />
                {name}
              </SheetTitle>
              <SheetDescription className="tabular-nums">
                {description}
              </SheetDescription>
            </SheetHeader>
            <FamilyStats family={family} />
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
              {family.variants.map((variant) => (
                <VariantModes
                  familyKey={family.family}
                  familyName={name}
                  heading={
                    showVariantHeadings
                      ? engineVariantLabel(variant.model, name)
                      : null
                  }
                  key={variant.model}
                  timeseriesPoints={timeseriesPoints}
                  variant={variant}
                />
              ))}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
