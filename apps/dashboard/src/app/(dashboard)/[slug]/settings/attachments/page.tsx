"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { PageContainer } from "@/components/layout/container";
import { AttachmentsSection } from "@/components/settings/attachments/attachments-section";

export default function SettingsAttachmentsPage() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-3xl tracking-tight">Attachments</h1>
            <Tooltip>
              <TooltipTrigger className="inline-flex cursor-help text-muted-foreground">
                <HugeiconsIcon
                  className="size-4"
                  icon={InformationCircleIcon}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Deleting files here removes them from any threads that reference
                them, but does not delete the threads themselves. This may lead
                to unexpected behavior if the file is still in use.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground">
            Manage your uploaded files and attachments.
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
