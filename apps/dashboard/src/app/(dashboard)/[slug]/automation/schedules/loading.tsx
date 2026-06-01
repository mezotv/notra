import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { SchedulePageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Schedules</h1>
            <p className="text-muted-foreground">
              Configure cron schedules that run daily, weekly, or monthly
            </p>
          </div>
          <Button className="gap-1.5">
            <HugeiconsIcon className="size-4" icon={Add01Icon} />
            Create Schedule
            <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
          </Button>
        </div>
        <SchedulePageSkeleton />
      </div>
    </PageContainer>
  );
}
