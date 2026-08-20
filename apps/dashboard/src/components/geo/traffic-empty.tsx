"use client";

import { EmptyStateTrafficPreview } from "@/components/empty-state-preview";
import { GeoIngestSetup } from "@/components/geo/geo-ingest-setup";
import type { TrafficEmptyProps } from "@/types/geo";

export function TrafficEmpty({ setup }: TrafficEmptyProps) {
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 select-none px-3 pt-3 sm:px-4 sm:pt-4"
      >
        <div className="opacity-[0.38] [mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]">
          <EmptyStateTrafficPreview />
        </div>
      </div>
      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col items-center overflow-y-auto px-6 pt-8 pb-4 text-center">
        <h3 className="text-balance font-semibold text-lg">
          No AI traffic yet
        </h3>
        <p className="mt-1.5 max-w-md text-pretty text-muted-foreground text-sm leading-relaxed">
          Install the tracker on your site. When ChatGPT, Claude, Perplexity, or
          another agent fetches a page, the visit shows up here.
        </p>
        <div className="mt-6 w-full text-left">
          <GeoIngestSetup
            className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5"
            setup={setup}
          />
        </div>
      </div>
    </div>
  );
}
