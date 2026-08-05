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
      <ResponsiveDialogContent className="max-h-[90svh] gap-4 overflow-hidden p-6 sm:max-w-4xl [&>*]:min-w-0">
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
