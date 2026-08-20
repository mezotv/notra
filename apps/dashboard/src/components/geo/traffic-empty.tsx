"use client";

import { EmptyState } from "@/components/empty-state";
import { EmptyStateTrafficPreview } from "@/components/empty-state-preview";
import { GeoIngestSetup } from "@/components/geo/geo-ingest-setup";
import type { TrafficEmptyProps } from "@/types/geo";

export function TrafficEmpty({ setup }: TrafficEmptyProps) {
  return (
    <div className="space-y-2">
      <EmptyState
        description="Install the tracker on your site. When ChatGPT, Claude, Perplexity, or another agent fetches a page, the visit shows up here."
        preview={<EmptyStateTrafficPreview />}
        title="No AI traffic yet"
      />
      <div className="-mt-6 mx-auto w-full max-w-2xl px-1">
        <GeoIngestSetup
          className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5"
          setup={setup}
        />
      </div>
    </div>
  );
}
