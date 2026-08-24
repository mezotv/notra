"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { CompetitorEditForm } from "@/components/geo/competitor-edit-form";
import type { CompetitorEditDialogProps } from "@/types/geo";

export function CompetitorEditDialog({
  open,
  onOpenChange,
  organizationId,
  competitor,
}: CompetitorEditDialogProps) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-semibold text-xl">
            {competitor ? `Edit ${competitor.name}` : "Add competitor"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {competitor
              ? "Name, website, and how this brand shows up in your charts."
              : "Track a brand AI engines might recommend instead of you."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <CompetitorEditForm
          competitor={competitor}
          onDone={() => onOpenChange(false)}
          organizationId={organizationId}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
