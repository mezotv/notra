import { PageContainer } from "@/components/layout/container";
import { PublishingSettingsSkeleton } from "./skeleton";

export default function Loading() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Publishing</h1>
          <p className="text-muted-foreground">
            Decide who has to approve content before it goes out
          </p>
        </div>
        <PublishingSettingsSkeleton />
      </div>
    </PageContainer>
  );
}
