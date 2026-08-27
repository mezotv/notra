"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

import { PageContainer } from "@/components/layout/container";

export function GroupDetailSkeleton() {
  const id = useId();
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              className="border-border/80 bg-muted/80 flex flex-col rounded-lg border p-2"
              key={`${id}-card-${i}`}
            >
              <div className="flex items-center justify-between gap-4 px-2 py-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="border-border/80 bg-background space-y-2 rounded-lg border px-4 py-3">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
