"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import { useState } from "react";

import { Button } from "@/components/button";
import { useGeoProjectDelete } from "@/lib/hooks/use-geo";
import type { GeoProjectDeleteSectionProps } from "@/types/geo";

export function GeoProjectDeleteSection({
  organizationId,
  project,
  replacementProjectId,
  onDeleted,
}: GeoProjectDeleteSectionProps) {
  const [open, setOpen] = useState(false);
  const deleteProject = useGeoProjectDelete(organizationId);
  const isLastProject = replacementProjectId === undefined;

  const handleDelete = async () => {
    if (isLastProject || deleteProject.isPending) {
      return;
    }

    try {
      await deleteProject.mutateAsync(project.id);
    } catch {
      return;
    }
    setOpen(false);
    onDeleted(replacementProjectId);
  };

  return (
    <section className="border-destructive/20 bg-destructive/5 space-y-4 rounded-xl border p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-destructive text-sm font-medium">Delete project</h2>
        <p className="text-muted-foreground text-sm text-pretty">
          {isLastProject
            ? "This is your only project. Create another project before deleting it."
            : "Permanently delete this project and all of its tracking data."}
        </p>
      </div>
      <Button
        disabled={isLastProject}
        onClick={() => setOpen(true)}
        type="button"
        variant="destructive"
      >
        <HugeiconsIcon className="size-4" icon={Delete02Icon} />
        Delete project
      </Button>

      <ResponsiveAlertDialog
        onOpenChange={(nextOpen) => {
          if (!deleteProject.isPending) {
            setOpen(nextOpen);
          }
        }}
        open={open}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete “{project.name}”?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This permanently deletes its settings, prompts, competitors,
              scans, and reports. This action cannot be undone.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={deleteProject.isPending}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              disabled={deleteProject.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              variant="destructive"
            >
              {deleteProject.isPending ? "Deleting..." : "Delete project"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </section>
  );
}
