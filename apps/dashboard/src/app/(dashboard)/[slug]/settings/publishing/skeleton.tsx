"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

export function PublishingSettingsSkeleton() {
  const id = useId();

  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          className="space-y-3 rounded-lg border border-border/80 border-b-border/40 bg-background px-4 py-3 shadow-2xs"
          key={`${id}-workflow-${index}`}
        >
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-12 w-40 rounded-md" />
            <Skeleton className="h-12 w-40 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
