"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import type {
  GeoSectionSkeletonProps,
  GeoTableSkeletonProps,
} from "@/types/geo";

export function GeoSectionSkeleton({
  eyebrow,
  action,
  children,
}: GeoSectionSkeletonProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex h-7 items-center">
          <h2 className="font-medium text-foreground text-sm capitalize leading-none">
            {eyebrow}
          </h2>
        </div>
        {action}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

export function GeoTableSkeleton({ rows }: GeoTableSkeletonProps) {
  const id = useId();
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="flex h-10 items-center justify-between bg-muted/40 px-4">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="flex h-13 items-center justify-between gap-4 border-border/60 border-t px-4"
          key={`${id}-row-${index}`}
        >
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
