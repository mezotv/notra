"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";

export function SchedulePageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <GeoTableSkeleton rows={5} />
    </div>
  );
}
