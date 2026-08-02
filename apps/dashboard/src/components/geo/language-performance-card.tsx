"use client";

import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { GEO_LANGUAGE_FLAGS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type {
  GeoLanguageSharePoint,
  LanguagePerformanceCardProps,
} from "@/types/geo";
import { formatMentionRate } from "@/utils/geo-charts";

const PERCENT = 100;
const MIN_BAR_PERCENT = 2;

function LanguageRow({
  point,
  isBaseline,
}: {
  point: GeoLanguageSharePoint;
  isBaseline: boolean;
}) {
  const percent = Math.round(point.mentionRate * PERCENT);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-sm">
          <span aria-hidden="true">{GEO_LANGUAGE_FLAGS[point.language]}</span>
          <span
            className={cn(
              "truncate",
              isBaseline ? "text-foreground/70" : "font-medium"
            )}
          >
            {point.language}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
          {point.mentions}/{point.checks} checks
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden bg-muted">
          <div
            className={cn(
              "h-full",
              isBaseline ? "bg-foreground/35" : "bg-foreground/80"
            )}
            style={{ width: `${Math.max(percent, MIN_BAR_PERCENT)}%` }}
          />
        </div>
        <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums">
          {formatMentionRate(point.mentionRate)}
        </span>
      </div>
    </div>
  );
}

export function LanguagePerformanceCard({
  points,
  configuredLanguages,
}: LanguagePerformanceCardProps) {
  const hasExtraLanguages =
    configuredLanguages.length > 0 ||
    points.some((point) => point.language !== "English");

  return (
    <InstrumentModule eyebrow="Performance by language" readout="30D">
      {hasExtraLanguages && points.length > 0 ? (
        <div className="space-y-3">
          {points.map((point) => (
            <LanguageRow
              isBaseline={point.language === "English"}
              key={point.language}
              point={point}
            />
          ))}
        </div>
      ) : (
        <InstrumentEmpty
          className="h-40"
          message="Add languages in settings to see how engines answer beyond English"
          seed="Performance by language"
        />
      )}
    </InstrumentModule>
  );
}
