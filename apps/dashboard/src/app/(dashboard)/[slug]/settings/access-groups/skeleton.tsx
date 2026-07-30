"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";

export function AccessGroupsSettingsSkeleton() {
  const id = useId();

  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-background shadow-2xs">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="space-y-2 px-4 py-3"
          key={`${id}-access-group-${index}`}
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-5 w-52 rounded-full" />
        </div>
      ))}
    </div>
  );
}
