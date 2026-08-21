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
          <p className="text-muted-foreground">
            AI crawlers and referrals visiting your site
          </p>
        </header>
        <div className="flex flex-col gap-6">
          <GeoSectionSkeleton
            action={<Skeleton className="h-3.5 w-24" />}
            eyebrow="AI traffic to your site"
          >
            <div className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground text-sm">
                    AI crawlers
                  </p>
                  <div className="flex h-9 items-center">
                    <Skeleton className="h-7 w-16" />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    bots fetching your pages
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground text-sm">
                    AI referrals
                  </p>
                  <div className="flex h-9 items-center">
                    <Skeleton className="h-7 w-16" />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    people arriving from an AI answer
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground text-sm">
                    Markdown requests
                  </p>
                  <div className="flex h-9 items-center">
                    <Skeleton className="h-7 w-16" />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    agents asking for text/markdown
                  </p>
                </div>
              </div>
              <GeoTableSkeleton rows={SOURCE_ROW_COUNT} />
            </div>
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
