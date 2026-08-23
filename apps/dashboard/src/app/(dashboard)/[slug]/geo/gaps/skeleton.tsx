"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { PageContainer } from "@/components/layout/container";

const GAP_ROW_COUNT = 6;

export function GeoGapsSkeleton({ embedded = false }: { embedded?: boolean }) {
  const table = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex h-8 shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      </div>
      <GeoTableSkeleton rows={GAP_ROW_COUNT} />
    </div>
  );

  if (embedded) {
    return table;
  }

  return (
    <PageContainer
      className="flex h-full min-h-full flex-1 flex-col overflow-hidden py-4 md:py-6"
      data-geo-gaps-page=""
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6 px-4 lg:px-6">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Content Gaps</h1>
            <p className="text-muted-foreground">
              Questions engines answer without mentioning you
            </p>
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </header>
        {table}
      </div>
    </PageContainer>
  );
}
