"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { PageContainer } from "@/components/layout/container";

export function ImageComparePageSkeleton() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </PageContainer>
  );
}
