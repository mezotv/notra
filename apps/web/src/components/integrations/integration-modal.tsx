"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { useRouter } from "next/navigation";
import { QUICK_VIEW_VISIBLE_TOOLS } from "@/constants/integrations";
import {
  buildQuickViewMetaTail,
  getToolDescription,
} from "@/lib/integrations/helpers";
import type { IntegrationModalProps } from "@/types/integrations";
import { IntegrationAuthorMeta } from "./integration-author-meta";
import { IntegrationBanner } from "./integration-banner";
import { IntegrationConnectButton } from "./integration-connect-button";
import { IntegrationLogo } from "./integration-logo";

export function IntegrationModal({ integration }: IntegrationModalProps) {
  const router = useRouter();

  return (
    <ResponsiveDialog
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
      open
    >
      <ResponsiveDialogContent
        className="max-h-[min(85vh,48rem)] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[40rem]"
        showCloseButton={false}
      >
        <ModalBody integration={integration} />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function ModalBody({ integration }: IntegrationModalProps) {
  const visibleTools = integration.tools.slice(0, QUICK_VIEW_VISIBLE_TOOLS);
  const remaining = integration.indexedToolCount - visibleTools.length;

  return (
    <div className="relative flex max-h-[min(85vh,48rem)] w-full min-w-0 flex-col">
      <IntegrationBanner
        className="h-[10.625rem] w-full shrink-0"
        integration={integration}
      />
      <ResponsiveDialogClose className="absolute top-4 right-4 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white text-[#1E1E1E] transition-colors [box-shadow:#ECECEC_0_0_0_0.0625rem,#28282814_0_0.0625rem_0.125rem] hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-[#1c1c1f] dark:text-white dark:hover:bg-white/[0.1] dark:[box-shadow:#FFFFFF1F_0_0_0_0.0625rem]">
        <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2} />
        <span className="sr-only">Close</span>
      </ResponsiveDialogClose>
      <div className="flex w-full min-w-0 shrink-0 items-center gap-3.5 px-7 pt-6">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-clip rounded-[0.875rem] bg-white [box-shadow:#ECECEC_0_0_0_0.0625rem,#28282814_0_0.0625rem_0.125rem] dark:bg-white/[0.06] dark:[box-shadow:#FFFFFF1F_0_0_0_0.0625rem]">
          <IntegrationLogo fill integration={integration} size={48} />
        </span>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <ResponsiveDialogTitle className="truncate font-sans font-semibold text-[#1E1E1E] text-[1.5rem] leading-[1.25] tracking-[-0.015em] dark:text-white">
            {integration.name}
          </ResponsiveDialogTitle>
          <IntegrationAuthorMeta
            className="font-sans text-[#1E1E1EA6] text-[0.875rem] leading-[1.29] tracking-[-0.01em] dark:text-white/60"
            integration={integration}
            tail={buildQuickViewMetaTail(integration)}
          />
        </div>
        <IntegrationConnectButton className="px-6 py-2.5 text-[0.875rem] leading-[1.29]" />
      </div>
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto pb-6">
        {integration.description ? (
          <ResponsiveDialogDescription className="px-7 pt-3.5 text-left font-sans text-[#1E1E1EBF] text-[0.875rem] leading-[1.5] tracking-[-0.005em] dark:text-white/70">
            {integration.description}
          </ResponsiveDialogDescription>
        ) : null}
        {visibleTools.length > 0 ? (
          <div className="flex w-full min-w-0 flex-col px-7 pt-5">
            <span className="mb-2 font-medium font-sans text-[#1E1E1E80] text-[0.75rem] leading-[1.33] tracking-[0.04em] dark:text-white/50">
              TOOLS · {integration.indexedToolCount}
            </span>
            {visibleTools.map((tool) => (
              <div
                className="flex h-[2.375rem] w-full min-w-0 items-center gap-4 [box-shadow:#F0F0F0_0_-0.0625rem_0_inset] dark:[box-shadow:#FFFFFF12_0_-0.0625rem_0_inset]"
                key={tool.name}
              >
                <span className="max-w-[45%] shrink-0 truncate font-medium font-mono text-[#1E1E1E] text-[0.8125rem] leading-[1.38] dark:text-white">
                  {tool.name}
                </span>
                <span className="min-w-0 flex-1 truncate text-right font-sans text-[#1E1E1EA6] text-[0.8125rem] leading-[1.38] dark:text-white/60">
                  {getToolDescription(tool)}
                </span>
              </div>
            ))}
            {remaining > 0 ? (
              <span className="pt-1.5 font-medium font-sans text-[#1E1E1E80] text-[0.8125rem] leading-[1.38] dark:text-white/50">
                + {remaining} more {remaining === 1 ? "tool" : "tools"}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex w-full min-w-0 shrink-0 items-center bg-[#FAFAFA] px-7 py-4 [box-shadow:#F0F0F0_0_0.0625rem_0_inset] dark:bg-white/[0.03] dark:[box-shadow:#FFFFFF12_0_0.0625rem_0_inset]">
        <span className="min-w-0 truncate font-sans text-[#1E1E1E80] text-[0.8125rem] leading-[1.31] dark:text-white/50">
          Reviewed by Notra
        </span>
      </div>
    </div>
  );
}
