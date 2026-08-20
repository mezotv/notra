"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import { PageContainer } from "@/components/layout/container";

const HEADER_BUTTON_COUNT = 3;
const TAB_COUNT = 4;
const TABLE_ROW_COUNT = 5;

export function GeoPageSkeleton() {
  const id = useId();
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-4 px-4 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: HEADER_BUTTON_COUNT }).map((_, index) => (
              <Skeleton
                className="h-8 w-24 rounded-lg"
                key={`${id}-button-${index}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 border-border border-b pb-2">
          {Array.from({ length: TAB_COUNT }).map((_, index) => (
            <Skeleton className="h-4 w-20" key={`${id}-tab-${index}`} />
          ))}
        </div>
        <div className="flex flex-col gap-6 pt-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-44" />
            <div className="overflow-hidden rounded-2xl border border-border">
              <Skeleton className="h-10 w-full rounded-none" />
              {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
                <div
                  className="border-border/60 border-t px-4 py-3"
                  key={`${id}-row-${index}`}
                >
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
