"use client";

import { useMemo } from "react";

import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import type { JourneyPathsCardProps } from "@/types/geo";
import { buildJourneyOverview } from "@/utils/geo-journey";

export function JourneyPathsCard({ journeys }: JourneyPathsCardProps) {
  const overview = useMemo(() => buildJourneyOverview(journeys), [journeys]);

  return (
    <InstrumentModule className="h-full" eyebrow="Fetched pages">
      {overview.uniquePaths === 0 ? (
        <InstrumentEmpty
          className="h-40"
          message="No fetched pages yet"
          seed="geo-journey-paths"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
            {overview.uniquePaths.toLocaleString()}
          </p>
          <div>
            <div className="text-muted-foreground flex items-center justify-between gap-3 px-1 pb-1.5 text-xs">
              <span>Page</span>
              <span>Journeys</span>
            </div>
            <div className="border-border border-t">
              {overview.paths.map((row, index) => (
                <div
                  className="flex items-center gap-3 border-b px-1 py-2.5 last:border-b-0"
                  key={row.path}
                >
                  <span className="text-muted-foreground w-4 shrink-0 text-right text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate font-mono text-sm"
                    title={row.path}
                  >
                    {row.path}
                  </span>
                  <span className="text-sm tabular-nums">
                    {row.journeys.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            {overview.uniquePaths > overview.paths.length ? (
              <p className="text-muted-foreground px-1 pt-2 text-xs tabular-nums">
                +
                {(
                  overview.uniquePaths - overview.paths.length
                ).toLocaleString()}{" "}
                more pages
              </p>
            ) : null}
          </div>
        </div>
      )}
    </InstrumentModule>
  );
}
