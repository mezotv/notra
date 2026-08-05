"use client";

import { Card, CardContent } from "@notra/ui/components/ui/card";
import { DirectionDelta } from "@/components/geo/directions/direction-delta";
import { PromptResultsTable } from "@/components/geo/directions/prompt-results-table";
import { EngineIcon } from "@/components/geo/engine-icon";
import { MentionRateCard } from "@/components/geo/mention-rate-card";
import { MentionTrendCard } from "@/components/geo/mention-trend-card";
import { ShareOfVoiceDonut } from "@/components/geo/share-of-voice-donut";
import { TrafficPagesCard } from "@/components/geo/traffic-pages-card";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import {
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
import {
  formatDirectionCount,
  formatDirectionRate,
} from "@/utils/geo-directions";

const AI_VISITS = GEO_DIRECTIONS_KPIS[0];

function HeroRow() {
  const best = GEO_DIRECTIONS_ENGINES[0];

  return (
    <InstrumentGrid className="grid-cols-2 lg:grid-cols-5">
      <Card className="col-span-2">
        <CardContent className="flex flex-1 flex-col justify-center gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            AI visibility
          </p>
          <div className="flex items-end gap-2">
            <p className="font-bold text-4xl text-primary tabular-nums">
              {formatDirectionRate(GEO_DIRECTIONS_VISIBILITY)}
            </p>
            <DirectionDelta
              className="mb-1"
              delta={GEO_DIRECTIONS_VISIBILITY_DELTA}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Share of tracked answers that name you, across every engine.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-1 flex-col justify-center gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            Best engine
          </p>
          <p className="flex items-center gap-2 truncate font-bold text-3xl tabular-nums">
            {best ? (
              <EngineIcon className="size-6" engine={best.engine} />
            ) : null}
            {best?.label ?? "N/A"}
          </p>
          <p className="text-muted-foreground text-xs">
            {best
              ? `${formatDirectionRate(best.rate)} mention rate`
              : "no scans"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-1 flex-col justify-center gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            Tracked prompts
          </p>
          <p className="font-bold text-3xl tabular-nums">
            {GEO_DIRECTIONS_PROMPT_COUNT}
          </p>
          <p className="text-muted-foreground text-xs">
            asked to every engine per scan
          </p>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardContent className="flex flex-1 flex-col justify-center gap-2">
          <p className="font-medium text-muted-foreground text-sm">
            AI traffic
          </p>
          <p className="font-bold text-3xl tabular-nums">
            {formatDirectionCount(AI_VISITS?.value ?? 0)}
          </p>
          <p className="text-muted-foreground text-xs">
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
          <MentionTrendCard hero points={GEO_DIRECTIONS_TIMESERIES} />
        </div>
        <div className="lg:col-span-4">
          <ShareOfVoiceDonut points={[...GEO_DIRECTIONS_SHARE]} />
        </div>
        <div className="lg:col-span-8">
          <MentionRateCard engines={GEO_DIRECTIONS_OVERVIEW_ENGINES} />
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
