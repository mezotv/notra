import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">GitHub</h1>
            <p className="text-muted-foreground">
              Connect your repositories through the Notra GitHub App to generate
              changelogs, blog posts, and more.
            </p>
          </div>
          <Button className="gap-1.5">
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Connect GitHub
            <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
          </Button>
        </div>
        <EmptyState
          description="Loading your GitHub App installation."
          title="Loading GitHub"
        />
      </div>
    </PageContainer>
  );
}
