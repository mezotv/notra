"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

export function IrisPageSkeleton() {
  const id = useId();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            className="h-[5.25rem] w-full rounded-xl"
            key={`${id}-tile-${index + 1}`}
          />
        ))}
      </div>

      <Skeleton className="h-9 w-56" />

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            className="h-36 w-full rounded-xl"
            key={`${id}-run-${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
