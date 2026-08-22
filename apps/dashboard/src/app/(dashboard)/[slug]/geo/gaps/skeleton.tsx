"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { PageContainer } from "@/components/layout/container";

const GAP_ROW_COUNT = 6;

export function GeoGapsSkeleton({ embedded = false }: { embedded?: boolean }) {
  const table = (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <GeoTableSkeleton rows={GAP_ROW_COUNT} />
    </div>
  );

  if (embedded) {
    return table;
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
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
