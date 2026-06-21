"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

export function GroupsPageSkeleton() {
  const id = useId();
  return (
    <div className="overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-muted/80 shadow-2xs">
      <div className="flex items-center gap-4 border-border/60 border-b bg-muted/80 px-4 py-2.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          className="flex items-center gap-4 border-border/60 border-b bg-background px-4 py-3 first:rounded-t-lg last:border-b-0"
          key={`${id}-row-${i}`}
        >
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
