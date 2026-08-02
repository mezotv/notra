"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import { PageContainer } from "@/components/layout/container";

const RAIL_TILE_COUNT = 4;
const MODULE_COUNT = 3;

export function GeoPageSkeleton() {
  const id = useId();
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-4 px-4 lg:px-6">
        <div className="space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border lg:grid-cols-4">
          {Array.from({ length: RAIL_TILE_COUNT }).map((_, index) => (
            <Skeleton
              className="h-20 w-full rounded-none"
              key={`${id}-rail-${index}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border lg:grid-cols-3">
          {Array.from({ length: MODULE_COUNT }).map((_, index) => (
            <Skeleton
              className="h-80 w-full rounded-none"
              key={`${id}-module-${index}`}
            />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </PageContainer>
  );
}
