"use client";

import { TitleCard } from "@notra/ui/components/ui/title-card";
import { PageContainer } from "@/components/layout/container";
import { AttachmentsSection } from "@/components/settings/attachments/attachments-section";

export default function SettingsAttachmentsPage() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Attachments</h1>
          <p className="text-muted-foreground">
            Manage your uploaded files and attachments. Note that deleting files
            here will remove them from the relevant threads, but not delete the
            threads. This may lead to unexpected behavior if you delete a file
            that is still being used in a thread.
          </p>
        </div>

        <div className="grid gap-6">
          <TitleCard heading="Files">
            <AttachmentsSection />
          </TitleCard>
        </div>
      </div>
    </PageContainer>
  );
}
