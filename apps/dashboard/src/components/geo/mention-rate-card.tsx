"use client";

import { useMemo } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoBar } from "@/components/geo/geo-bar";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { GEO_MEMORY_LABEL, GEO_SEARCH_LABEL } from "@/constants/geo";
import type { GeoOverviewEngine, MentionRateCardProps } from "@/types/geo";
import { engineFamilyLabel, formatMentionRate } from "@/utils/geo-charts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

interface EngineFamily {
  family: string;
  label: string;
  web: GeoOverviewEngine | null;
  raw: GeoOverviewEngine | null;
}

const GROUNDED_SUFFIX = /(-direct)?-grounded$/;

function isGrounded(engine: string): boolean {
  return GROUNDED_SUFFIX.test(engine) || engine === "perplexity-sonar";
}

function familyOf(engine: string): string {
  return engine.replace(GROUNDED_SUFFIX, "");
}

function groupEngines(engines: GeoOverviewEngine[]): EngineFamily[] {
  const families = new Map<string, EngineFamily>();
  for (const engine of engines) {
    const family = familyOf(engine.engine);
    const entry = families.get(family) ?? {
      family,
      label: engineFamilyLabel(family),
      web: null,
      raw: null,
    };
    if (isGrounded(engine.engine)) {
      entry.web = engine;
    } else {
      entry.raw = engine;
    }
    families.set(family, entry);
  }
  return [...families.values()].sort(
    (a, b) =>
      Math.max(b.web?.mentionRate ?? 0, b.raw?.mentionRate ?? 0) -
      Math.max(a.web?.mentionRate ?? 0, a.raw?.mentionRate ?? 0)
  );
}

function RateBar({
  variant,
  engine,
}: {
  variant: "web" | "raw";
  engine: GeoOverviewEngine | null;
}) {
  if (!engine) {
    return null;
  }
  const label = variant === "web" ? GEO_SEARCH_LABEL : GEO_MEMORY_LABEL;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-muted-foreground text-xs">
        {label}
      </span>
      <GeoBar
        className="h-2 w-auto flex-1"
        fillClassName={variant === "web" ? "bg-chart-1" : "bg-chart-2"}
        value={engine.mentionRate}
      />
      <span className="w-24 shrink-0 text-right text-xs tabular-nums">
        <span className="text-foreground text-sm">
          {formatMentionRate(engine.mentionRate)}
        </span>{" "}
        <span className="text-muted-foreground">
          {engine.mentions}/{engine.checks}
        </span>
      </span>
    </div>
  );
}

export function MentionRateCard({
  engines,
  isScanning = false,
}: MentionRateCardProps) {
  const families = useMemo(() => groupEngines(engines), [engines]);

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
        <div className="grid content-start gap-x-8 gap-y-3.5 sm:grid-cols-2">
          {families.map((family) => (
            <div className="space-y-1.5" key={family.family}>
              <div className="flex items-baseline justify-between">
                <span className="inline-flex items-center gap-2 font-medium text-sm">
                  <EngineIcon engine={family.family} />
                  {family.label}
                </span>
                {family.web?.avgPosition !== null &&
                  family.web?.avgPosition !== undefined && (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      avg position {family.web.avgPosition}
                    </span>
                  )}
              </div>
              <RateBar engine={family.web} variant="web" />
              <RateBar engine={family.raw} variant="raw" />
            </div>
          ))}
        </div>
      )}
    </InstrumentModule>
  );
}
