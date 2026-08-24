"use client";

import Link from "next/link";
import { Button } from "@/components/button";
import { EmptyStateAnalyticsPreview } from "@/components/empty-state-preview";
import type { GeoSetupEmptyProps } from "@/types/geo";

export function GeoSetupEmpty({ settingsHref }: GeoSetupEmptyProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 select-none px-3 pt-3 sm:px-4 sm:pt-4"
      >
        <div className="mask-[linear-gradient(to_bottom,black_0%,transparent_100%)] opacity-[0.38]">
          <EmptyStateAnalyticsPreview />
        </div>
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 pt-16 pb-8 text-center">
        <h3 className="text-balance font-semibold text-lg">
          AI visibility is not set up yet
        </h3>
        <p className="mt-1.5 max-w-md text-pretty text-muted-foreground text-sm leading-relaxed">
          Add your brand name and the engines to track, then run a scan to see
          how AI answers talk about you.
        </p>
        <Button
          className="mt-6"
          nativeButton={false}
          render={<Link href={settingsHref} />}
          size="sm"
        >
          Set up tracking
        </Button>
      </div>
    </div>
  );
}
