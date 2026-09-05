"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { useRouter } from "next/navigation";

import type { CompetitorSheetProps } from "@/types/geo";

export function CompetitorModal({ title, children }: CompetitorSheetProps) {
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
      <ResponsiveDialogContent className="duration-normal max-h-[90svh] gap-5 overflow-y-auto p-6 transition-[filter] data-[nested-dialog-open]:blur-xs data-[nested-dialog-open]:brightness-95 sm:max-w-3xl [&>*]:min-w-0">
        <ResponsiveDialogHeader className="sr-only">
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            How AI engines mention {title} across your tracked prompts
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {children}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
