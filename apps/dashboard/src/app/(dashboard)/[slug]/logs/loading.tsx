import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { PageContainer } from "@/components/layout/container";
import { LogsPageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-3xl tracking-tight">Logs</h1>
            <HugeiconsIcon
              className="size-4 text-muted-foreground"
              icon={InformationCircleIcon}
            />
          </div>
          <p className="text-muted-foreground">
            View all integration events and their delivery status
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full sm:flex-1" />
          <Skeleton className="h-9 w-full sm:w-44" />
          <Skeleton className="h-9 w-full sm:w-40" />
        </div>
        <LogsPageSkeleton />
      </div>
    </PageContainer>
  );
}
