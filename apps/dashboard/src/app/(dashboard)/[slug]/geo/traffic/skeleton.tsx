"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  GeoSectionSkeleton,
  GeoTableSkeleton,
} from "@/components/geo/skeleton-parts";
import { PageContainer } from "@/components/layout/container";

const SOURCE_ROW_COUNT = 4;
const PAGE_ROW_COUNT = 4;
const CITATION_ROW_COUNT = 6;

export function GeoTrafficSkeleton() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">AI Traffic</h1>
          <p className="text-muted-foreground text-sm">
            AI crawlers and referrals visiting your site
          </p>
        </header>
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {["Crawlers", "Referrals", "Total"].map((label) => (
                <div className="space-y-2 px-5 py-4" key={label}>
                  <Skeleton className="h-3 w-16" />
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-border border-t p-4">
              <Skeleton className="h-52 w-full rounded-xl" />
            </div>
          </div>
          <GeoSectionSkeleton
            action={<Skeleton className="h-3.5 w-36" />}
            eyebrow="Sources"
          >
            <GeoTableSkeleton rows={SOURCE_ROW_COUNT} />
          </GeoSectionSkeleton>
          <GeoSectionSkeleton
            action={<Skeleton className="h-3.5 w-8" />}
            eyebrow="Top pages by AI source"
          >
            <GeoTableSkeleton rows={PAGE_ROW_COUNT} />
          </GeoSectionSkeleton>
          <GeoSectionSkeleton
            action={<Skeleton className="h-3.5 w-24" />}
            eyebrow="Recent citations"
          >
            <GeoTableSkeleton rows={CITATION_ROW_COUNT} />
          </GeoSectionSkeleton>
        </div>
      </div>
    </PageContainer>
  );
}
