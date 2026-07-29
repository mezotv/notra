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
import { useDeleteRole } from "@/lib/hooks/use-roles";
import { errorMessageOr } from "@/lib/utils";
import type { DeleteRoleDialogProps } from "@/types/settings/roles";

export function DeleteRoleDialog({
  open,
  onOpenChange,
  organizationId,
  role,
}: DeleteRoleDialogProps) {
  const deleteRole = useDeleteRole(organizationId);

  const handleDelete = () => {
    if (!role) {
      return;
    }

    deleteRole.mutate(role.id, {
      onSuccess: () => {
        toast.success(`${role.name} has been deleted`);
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(errorMessageOr(error.message, "Failed to delete role"));
      },
    });
  };

  return (
    <ResponsiveAlertDialog
      onOpenChange={(nextOpen) => {
        if (!deleteRole.isPending) {
          onOpenChange(nextOpen);
        }
      }}
      open={open}
    >
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>
            Delete {role?.name}?
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            Members with this role lose the permissions it grants. This cannot
            be undone.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel disabled={deleteRole.isPending}>
            Cancel
          </ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteRole.isPending}
            onClick={handleDelete}
          >
            {deleteRole.isPending ? "Deleting..." : "Delete role"}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
