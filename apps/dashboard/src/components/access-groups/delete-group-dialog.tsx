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
import { useDeleteAccessGroup } from "@/lib/hooks/use-access-groups";
import { errorMessageOr } from "@/lib/utils";
import type { DeleteAccessGroupDialogProps } from "@/types/settings/access-groups";

export function DeleteAccessGroupDialog({
  open,
  onOpenChange,
  organizationId,
  accessGroup,
}: DeleteAccessGroupDialogProps) {
  const deleteAccessGroup = useDeleteAccessGroup(organizationId);

  const handleDelete = () => {
    if (!accessGroup) {
      return;
    }

    deleteAccessGroup.mutate(accessGroup.id, {
      onSuccess: () => {
        toast.success(`${accessGroup.name} has been deleted`);
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(
          errorMessageOr(error.message, "Failed to delete access group")
        );
      },
    });
  };

  return (
    <ResponsiveAlertDialog
      onOpenChange={(nextOpen) => {
        if (!deleteAccessGroup.isPending) {
          onOpenChange(nextOpen);
        }
      }}
      open={open}
    >
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>
            Delete {accessGroup?.name}?
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            Members in this access group lose the permissions it grants. This
            cannot be undone.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel disabled={deleteAccessGroup.isPending}>
            Cancel
          </ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteAccessGroup.isPending}
            onClick={handleDelete}
          >
            {deleteAccessGroup.isPending
              ? "Deleting..."
              : "Delete access group"}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
