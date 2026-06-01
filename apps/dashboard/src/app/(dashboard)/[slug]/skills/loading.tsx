import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { SkillsPageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Skills</h1>
            <p className="text-muted-foreground">
              Reusable instructions your agents load when generating content.
            </p>
          </div>
          <Button className="gap-1.5">
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Create Skill
            <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
          </Button>
        </div>
        <SkillsPageSkeleton />
      </div>
    </PageContainer>
  );
}
