"use client";

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
import { toast } from "sonner";
import { useDeleteWorkflow } from "@/lib/hooks/use-approval-workflows";
import { errorMessageOr } from "@/lib/utils";
import type { DeleteWorkflowDialogProps } from "@/types/settings/publishing";

export function DeleteWorkflowDialog({
  open,
  onOpenChange,
  organizationId,
  workflow,
}: DeleteWorkflowDialogProps) {
  const deleteWorkflow = useDeleteWorkflow(organizationId);

  const handleDelete = () => {
    if (!workflow) {
      return;
    }

    deleteWorkflow.mutate(workflow.id, {
      onSuccess: () => {
        toast.success(`${workflow.name} has been deleted`);
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(errorMessageOr(error.message, "Failed to delete workflow"));
      },
    });
  };

  return (
    <ResponsiveAlertDialog
      onOpenChange={(nextOpen) => {
        if (!deleteWorkflow.isPending) {
          onOpenChange(nextOpen);
        }
      }}
      open={open}
    >
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>
            Delete {workflow?.name}?
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            Content covered by this workflow no longer needs approval before it
            is published.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel disabled={deleteWorkflow.isPending}>
            Cancel
          </ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteWorkflow.isPending}
            onClick={handleDelete}
          >
            {deleteWorkflow.isPending ? "Deleting..." : "Delete workflow"}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
