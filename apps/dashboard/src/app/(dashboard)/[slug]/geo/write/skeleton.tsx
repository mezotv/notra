"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { PageContainer } from "@/components/layout/container";

const BRIEF_ROW_COUNT = 6;

export function GeoWriterSkeleton({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const table = <GeoTableSkeleton rows={BRIEF_ROW_COUNT} />;

  if (embedded) {
    return table;
  }

  return (
    <PageContainer
      className="flex h-full min-h-full flex-1 flex-col overflow-hidden py-4 md:py-6"
      data-geo-write-page=""
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6 px-4 lg:px-6">
        <header className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Write</h1>
            <p className="max-w-2xl text-pretty text-muted-foreground text-sm">
              Plan a custom article from a topic, type, and brand. Questions
              engines already answer live on Content Gaps.
            </p>
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </header>
        {table}
      </div>
    </PageContainer>
  );
}
