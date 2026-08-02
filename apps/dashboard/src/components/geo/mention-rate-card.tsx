"use client";

import { useMemo } from "react";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import { GEO_ENGINE_LABELS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { GeoOverviewEngine, MentionRateCardProps } from "@/types/geo";
import { formatMentionRate } from "@/utils/geo-charts";

interface EngineFamily {
  family: string;
  label: string;
  web: GeoOverviewEngine | null;
  raw: GeoOverviewEngine | null;
}

const GROUNDED_SUFFIX = /(-direct)?-grounded$/;
const WEB_LABEL_SUFFIX = /\s*\(web\)$/;

function isGrounded(engine: string): boolean {
  return GROUNDED_SUFFIX.test(engine) || engine === "perplexity-sonar";
}

function familyOf(engine: string): string {
  return engine.replace(GROUNDED_SUFFIX, "");
}

function familyLabel(family: string): string {
  const label =
    GEO_ENGINE_LABELS[family] ?? GEO_ENGINE_LABELS[`${family}-grounded`];
  if (!label) {
    return family;
  }
  return label.replace(WEB_LABEL_SUFFIX, "");
}

function groupEngines(engines: GeoOverviewEngine[]): EngineFamily[] {
  const families = new Map<string, EngineFamily>();
  for (const engine of engines) {
    const family = familyOf(engine.engine);
    const entry = families.get(family) ?? {
      family,
      label: familyLabel(family),
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
  const percent = Math.round(engine.mentionRate * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 font-mono text-[0.625rem] text-muted-foreground uppercase tracking-wider">
        {variant}
      </span>
      <div className="h-2 flex-1 overflow-hidden bg-muted">
        <div
          className={cn(
            "h-full",
            variant === "web" ? "bg-foreground/80" : "bg-foreground/35"
          )}
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right font-mono text-xs tabular-nums">
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

export function MentionRateCard({ engines }: MentionRateCardProps) {
  const families = useMemo(() => groupEngines(engines), [engines]);

  return (
    <InstrumentModule eyebrow="Mention rate" readout="30D">
      {families.length === 0 ? (
        <InstrumentEmpty
          className="h-40"
          message="No scans yet"
          seed="Mention rate"
        />
      ) : (
        <div className="grid content-start gap-x-8 gap-y-3.5 sm:grid-cols-2">
          {families.map((family) => (
            <div className="space-y-1.5" key={family.family}>
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-sm">{family.label}</span>
                {family.web?.avgPosition !== null &&
                  family.web?.avgPosition !== undefined && (
                    <span className="font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
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
