"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
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
import { geoModeColor, geoModeFillClass } from "@/utils/chart-colors";
import {
  engineFamilyAvgPosition,
  engineFamilyLabel,
  engineFamilyLastCheckedAt,
  engineFamilyTotals,
  engineVariantLabel,
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
  if (!engine) {
    return null;
  }

  const values = data.map((point) => point.value);
  const showSparkline = values.length >= GEO_SPARKLINE_MIN_POINTS;
  const variant = mode === "search" ? "web" : "raw";

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 font-medium text-sm">
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
          className="h-10 w-full"
          color={geoModeColor(variant)}
          data={values}
        />
      ) : (
        <GeoBar
          fillClassName={cn("rounded-full", geoModeFillClass(variant))}
          value={engine.mentionRate}
        />
      )}
      <p className="text-muted-foreground text-xs">{hint}</p>
    </section>
  );
}

function FamilyStats({ family }: { family: GeoEngineFamily }) {
  const totals = engineFamilyTotals(family);
  const position = engineFamilyAvgPosition(family);
  const lastChecked = engineFamilyLastCheckedAt(family);

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs">Mention rate</dt>
          <dd className="font-medium text-sm tabular-nums">
            {totals ? formatMentionRate(totals.rate) : "—"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs">Checks</dt>
          <dd className="font-medium text-sm tabular-nums">
            {totals ? `${totals.mentions}/${totals.checks}` : "—"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground text-xs">Avg position</dt>
          <dd className="font-medium text-sm tabular-nums">
            {position === null ? "—" : `#${position}`}
          </dd>
        </div>
      </dl>
      {lastChecked ? (
        <p className="text-muted-foreground text-xs tabular-nums">
          Last checked {formatAiTrafficTimestamp(lastChecked)}
        </p>
      ) : null}
    </div>
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

  return (
    <div className="space-y-4">
      {heading ? <h3 className="font-medium text-sm">{heading}</h3> : null}
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
      {variant.web && !variant.raw ? (
        <p className="text-muted-foreground text-xs">
          {heading ?? familyName} only answers with search, so there is no
          second mode.
        </p>
      ) : null}
    </div>
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

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="overflow-hidden rounded-xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:border sm:max-w-md">
        {family ? (
          <>
            <SheetHeader className="border-b bg-muted/50 pr-14">
              <SheetTitle className="flex items-center gap-2">
                <EngineIcon className="size-5" engine={family.family} />
                {name}
              </SheetTitle>
              <SheetDescription>
                {showVariantHeadings
                  ? "How each model mentions you"
                  : "How this engine mentions you"}
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
              <FamilyStats family={family} />
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
