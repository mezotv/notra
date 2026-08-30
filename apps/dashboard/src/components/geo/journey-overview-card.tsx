"use client";

import { GEO_JOURNEY_DEEP_CRAWL_PAGES } from "@notra/geo-core/constants/geo";
import { formatGeoSource } from "@notra/geo-core/utils/ai-traffic";
import { useMemo } from "react";

import { EngineIcon } from "@/components/geo/engine-icon";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import type { JourneyOverviewCardProps } from "@/types/geo";
import { buildJourneyOverview } from "@/utils/geo-journey";

function shareLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function JourneyOverviewCard({ journeys }: JourneyOverviewCardProps) {
  const overview = useMemo(() => buildJourneyOverview(journeys), [journeys]);

  return (
    <InstrumentModule className="h-full" eyebrow="Journeys">
      {overview.total === 0 ? (
        <InstrumentEmpty
          className="h-40"
          message="No agent journeys captured yet"
          seed="geo-journey-overview"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
            {overview.total.toLocaleString()}
          </p>
          <dl className="text-muted-foreground grid grid-cols-3 gap-3 text-xs">
            <div>
              <dt>Median depth</dt>
              <dd className="text-foreground mt-0.5 text-sm tabular-nums">
                {overview.medianPages}{" "}
                {overview.medianPages === 1 ? "page" : "pages"}
              </dd>
            </div>
            <div>
              <dt>Single-fetch</dt>
              <dd className="text-foreground mt-0.5 text-sm tabular-nums">
                {shareLabel(overview.singleFetchShare)}
              </dd>
            </div>
            <div>
              <dt>Crawl {GEO_JOURNEY_DEEP_CRAWL_PAGES}+</dt>
              <dd className="text-foreground mt-0.5 text-sm tabular-nums">
                {shareLabel(overview.deepShare)}
              </dd>
            </div>
          </dl>
          <div>
            <div className="text-muted-foreground flex items-center justify-between gap-3 px-1 pb-1.5 text-xs">
              <span>Source</span>
              <span>Journeys</span>
            </div>
            <div className="border-border border-t">
              {overview.sources.map((row, index) => {
                const name = formatGeoSource(row.source);
                return (
                  <div
                    className="flex items-center gap-3 border-b px-1 py-2.5 last:border-b-0"
                    key={`${row.source}-${row.visitorType}`}
                  >
                    <span className="text-muted-foreground w-4 shrink-0 text-right text-xs tabular-nums">
                      {index + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <EngineIcon engine={row.source} />
                      <span className="truncate text-sm font-medium">
                        {name}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums">
                      {row.journeys.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            {overview.uniqueSources > overview.sources.length ? (
              <p className="text-muted-foreground px-1 pt-2 text-xs tabular-nums">
                +
                {(
                  overview.uniqueSources - overview.sources.length
                ).toLocaleString()}{" "}
                more sources
              </p>
            ) : null}
          </div>
        </div>
      )}
    </InstrumentModule>
  );
}
