"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { PageContainer } from "@/components/layout/container";

const SHELF_ROW_COUNT = 8;

export function GeoShelfSkeleton() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Shelf Space</h1>
            <p className="text-muted-foreground">
              Third-party pages AI engines cite for your prompts, and whether
              you're on them
            </p>
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </header>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-72 rounded-md" />
            <Skeleton className="h-9 w-44 rounded-md" />
            <Skeleton className="h-9 w-44 rounded-md" />
          </div>
          <GeoTableSkeleton rows={SHELF_ROW_COUNT} />
        </div>
      </div>
    </PageContainer>
  );
}
