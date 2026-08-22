"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { PageContainer } from "@/components/layout/container";

const BRIEF_ROW_KEYS = ["row-a", "row-b", "row-c"] as const;

export function GeoWriterSkeleton({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const list = (
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <div className="divide-y divide-border border-y">
        {BRIEF_ROW_KEYS.map((key) => (
          <div
            className="flex items-center justify-between gap-3 px-1 py-2.5"
            key={key}
          >
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return list;
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Write</h1>
            <p className="text-muted-foreground">
              Custom topics open a brief dialog. Questions engines already
              answer without you live on Content Gaps.
            </p>
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </header>
        {list}
      </div>
    </PageContainer>
  );
}
