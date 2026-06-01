import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { PageContainer } from "@/components/layout/container";
import { IntegrationsPageSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect external services to automate your workflows
          </p>
        </div>
        <div>
          <div className="flex gap-6 border-b pb-3">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="pt-4">
            <IntegrationsPageSkeleton />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
