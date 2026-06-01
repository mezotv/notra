import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { PageContainer } from "@/components/layout/container";
import { ContentPageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Content</h1>
            <p className="text-muted-foreground">
              View and manage your generated content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
        <ContentPageSkeleton />
      </div>
    </PageContainer>
  );
}
