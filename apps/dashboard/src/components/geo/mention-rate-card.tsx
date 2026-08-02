"use client";

import { Line } from "@notra/ui/components/dither-kit/area";
import { LineChart } from "@notra/ui/components/dither-kit/area-chart";
import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";
import { Grid } from "@notra/ui/components/dither-kit/grid";
import { Tooltip } from "@notra/ui/components/dither-kit/tooltip";
import { XAxis } from "@notra/ui/components/dither-kit/x-axis";
import { YAxis } from "@notra/ui/components/dither-kit/y-axis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { useMemo } from "react";
import { ACCOUNT_SERIES_COLORS } from "@/constants/analytics";
import { GEO_ENGINE_LABELS } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { GeoOverviewEngine, GeoTimeseriesPoint } from "@/types/geo";
import { buildMentionRateRows, formatMentionRate } from "@/utils/geo-charts";

interface MentionRateCardProps {
  engines: GeoOverviewEngine[];
  points: GeoTimeseriesPoint[];
}

interface EngineFamily {
  family: string;
  label: string;
  web: GeoOverviewEngine | null;
  raw: GeoOverviewEngine | null;
}

const GROUNDED_SUFFIX = /(-direct)?-grounded$/;
const WEB_LABEL_SUFFIX = /\s*\(web\)$/;
const TREND_MIN_DAYS = 5;

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
      <span className="w-8 shrink-0 text-muted-foreground text-xs">
        {variant}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            variant === "web" ? "bg-foreground/80" : "bg-foreground/35"
          )}
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-xs tabular-nums">
        <span className="font-semibold text-foreground text-sm">
          {formatMentionRate(engine.mentionRate)}
        </span>{" "}
        <span className="text-muted-foreground">
          {engine.mentions}/{engine.checks}
        </span>
      </span>
    </div>
  );
}

export function MentionRateCard({ engines, points }: MentionRateCardProps) {
  const families = useMemo(() => groupEngines(engines), [engines]);
  const { rows, engines: trendEngines } = useMemo(
    () => buildMentionRateRows(points),
    [points]
  );
  const distinctDays = rows.length;

  const trendConfig = useMemo(() => {
    const config: ChartConfig = {};
    trendEngines.forEach((engine, index) => {
      config[engine] = {
        label: GEO_ENGINE_LABELS[engine] ?? engine,
        color:
          ACCOUNT_SERIES_COLORS[index % ACCOUNT_SERIES_COLORS.length] ??
          "purple",
      };
    });
    return config;
  }, [trendEngines]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mention rate</CardTitle>
        <CardDescription>
          How often each engine mentions you, with web search (web) and without
          (raw)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {families.length === 0 ? (
          <p className="flex h-40 items-center justify-center text-muted-foreground text-sm">
            No scans yet
          </p>
        ) : (
          <div className="space-y-4">
            {families.map((family) => (
              <div className="space-y-1.5" key={family.family}>
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-sm">{family.label}</span>
                  {family.web?.avgPosition !== null &&
                    family.web?.avgPosition !== undefined && (
                      <span className="text-muted-foreground text-xs">
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
        {distinctDays >= TREND_MIN_DAYS && (
          <div className="mt-6 border-t pt-4">
            <LineChart className="h-48 w-full" config={trendConfig} data={rows}>
              <Grid />
              <XAxis dataKey="day" />
              <YAxis />
              {trendEngines.map((engine) => (
                <Line dataKey={engine} key={engine} />
              ))}
              <Tooltip labelKey="day" valueFormatter={(value) => `${value}%`} />
            </LineChart>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
