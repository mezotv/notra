"use client";

import { Card, CardContent } from "@notra/ui/components/ui/card";
import { DirectionDelta } from "@/components/geo/directions/direction-delta";
import { PromptResultsTable } from "@/components/geo/directions/prompt-results-table";
import { EngineIcon } from "@/components/geo/engine-icon";
import { MentionRateCard } from "@/components/geo/mention-rate-card";
import { MentionTrendCard } from "@/components/geo/mention-trend-card";
import { ShareOfVoiceCard } from "@/components/geo/share-of-voice-card";
import { TrafficPagesCard } from "@/components/geo/traffic-pages-card";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import {
  GEO_DIRECTIONS_COMPANY,
  GEO_DIRECTIONS_ENGINES,
  GEO_DIRECTIONS_KPIS,
  GEO_DIRECTIONS_OVERVIEW_ENGINES,
  GEO_DIRECTIONS_PAGES,
  GEO_DIRECTIONS_PROMPT_COUNT,
  GEO_DIRECTIONS_SHARE,
  GEO_DIRECTIONS_TIMESERIES,
  GEO_DIRECTIONS_VISIBILITY,
  GEO_DIRECTIONS_VISIBILITY_DELTA,
} from "@/constants/geo-directions";
import { formatMentionRate } from "@/utils/geo-charts";
import { formatDirectionCount } from "@/utils/geo-directions";

const AI_VISITS = GEO_DIRECTIONS_KPIS[0];

function HeroRow() {
  const best = GEO_DIRECTIONS_ENGINES[0];

  return (
    <InstrumentGrid className="grid-cols-2 lg:grid-cols-4">
      <Card className="h-full min-w-0 overflow-visible">
        <CardContent className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            AI visibility
          </p>
          <div className="flex min-w-0 items-center gap-2">
            <p className="font-bold text-3xl text-primary tabular-nums leading-tight">
              {formatMentionRate(GEO_DIRECTIONS_VISIBILITY)}
            </p>
            <DirectionDelta delta={GEO_DIRECTIONS_VISIBILITY_DELTA} />
          </div>
          <p className="min-w-0 text-pretty text-muted-foreground text-xs leading-snug">
            Share of tracked answers that name you, across every engine.
          </p>
        </CardContent>
      </Card>
      <Card className="h-full min-w-0 overflow-visible">
        <CardContent className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            Best engine
          </p>
          <p className="flex min-w-0 items-center gap-2 font-bold text-3xl leading-tight">
            {best ? (
              <EngineIcon className="size-6 shrink-0" engine={best.engine} />
            ) : null}
            <span className="wrap-break-word min-w-0">
              {best?.label ?? "N/A"}
            </span>
          </p>
          <p className="min-w-0 text-muted-foreground text-xs leading-snug">
            {best ? `${formatMentionRate(best.rate)} mention rate` : "no scans"}
          </p>
        </CardContent>
      </Card>
      <Card className="h-full min-w-0 overflow-visible">
        <CardContent className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            Tracked prompts
          </p>
          <p className="font-bold text-3xl tabular-nums leading-tight">
            {GEO_DIRECTIONS_PROMPT_COUNT}
          </p>
          <p className="min-w-0 text-muted-foreground text-xs leading-snug">
            asked to every engine per scan
          </p>
        </CardContent>
      </Card>
      <Card className="h-full min-w-0 overflow-visible">
        <CardContent className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            AI traffic
          </p>
          <p className="font-bold text-3xl tabular-nums leading-tight">
            {formatDirectionCount(AI_VISITS?.value ?? 0)}
          </p>
          <p className="min-w-0 text-muted-foreground text-xs leading-snug">
            {AI_VISITS?.hint ?? ""}
          </p>
        </CardContent>
      </Card>
    </InstrumentGrid>
  );
}

export function DirectionInstrument() {
  return (
    <div className="space-y-4">
      <HeroRow />
      <InstrumentGrid className="grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <MentionTrendCard points={GEO_DIRECTIONS_TIMESERIES} />
        </div>
        <div className="lg:col-span-4">
          <ShareOfVoiceCard
            companyName={GEO_DIRECTIONS_COMPANY}
            points={[...GEO_DIRECTIONS_SHARE]}
          />
        </div>
        <div className="lg:col-span-8">
          <MentionRateCard
            engines={GEO_DIRECTIONS_OVERVIEW_ENGINES}
            timeseriesPoints={GEO_DIRECTIONS_TIMESERIES}
          />
        </div>
        <div className="lg:col-span-4">
          <TrafficPagesCard pages={[...GEO_DIRECTIONS_PAGES]} />
        </div>
        <div className="lg:col-span-12">
          <InstrumentModule
            eyebrow="Prompt results"
            readout="position per engine"
          >
            <PromptResultsTable />
          </InstrumentModule>
        </div>
      </InstrumentGrid>
    </div>
  );
}
