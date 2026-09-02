import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { PageContainer } from "@/components/layout/container";

import { CollectionsPageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Content</h1>
            <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
              Every batch of generated content, organized into collections.
            </p>
          </div>
          <Skeleton className="h-9 w-40 rounded-md" />
        </header>
        <CollectionsPageSkeleton />
      </div>
    </PageContainer>
  );
}
