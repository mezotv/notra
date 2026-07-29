import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { PersonasPageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Personas</h1>
            <p className="text-muted-foreground">
              Individual voices your team can publish content as.
            </p>
          </div>
          <Button className="gap-1.5">
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Create Persona
          </Button>
        </div>
        <PersonasPageSkeleton />
      </div>
    </PageContainer>
  );
}
