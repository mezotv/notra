"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
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
import { Input } from "@notra/ui/components/ui/input";
import { useState } from "react";
import type { AffectedSchedule } from "@/schemas/integrations";

interface DeleteIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationName: string;
  affectedSchedules: AffectedSchedule[];
  isLoadingSchedules: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function DeleteIntegrationDialog({
  open,
  onOpenChange,
  integrationName,
  affectedSchedules,
  isLoadingSchedules,
  isDeleting,
  onConfirm,
}: DeleteIntegrationDialogProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const isDeleteConfirmMatch = deleteConfirmation.trim() === integrationName;
  const hasAffectedSchedules = affectedSchedules.length > 0;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDeleteConfirmation("");
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    onConfirm();
    setDeleteConfirmation("");
  };

  return (
    <ResponsiveAlertDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveAlertDialogContent className="sm:max-w-[520px]">
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle className="text-lg">
            Delete {integrationName}?
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            This action permanently removes the integration and all connected
            metadata. Type{" "}
            <span className="font-semibold">{integrationName}</span> to confirm.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>

        {isLoadingSchedules && (
          <div className="text-muted-foreground text-sm">
            Checking for affected schedules...
          </div>
        )}

        {!isLoadingSchedules && hasAffectedSchedules && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={Calendar03Icon} size={18} />
              <p className="font-medium text-sm">
                {affectedSchedules.length === 1
                  ? "This schedule will be disabled:"
                  : "These schedules will be disabled:"}
              </p>
            </div>
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              {affectedSchedules.slice(0, 3).map((schedule) => (
                <div className="flex items-center gap-2" key={schedule.id}>
                  <p className="text-sm">{schedule.name}</p>
                </div>
              ))}
              {affectedSchedules.length > 3 && (
                <p className="text-muted-foreground text-xs">
                  and {affectedSchedules.length - 3} more...
                </p>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              These schedules use this integration and will be disabled.
              You&apos;ll need to edit them before re-enabling.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Input
            aria-label="Confirm integration deletion"
            autoComplete="off"
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={integrationName}
            value={deleteConfirmation}
          />
          <p className="text-muted-foreground text-xs">
            Deletion is permanent and cannot be undone.
          </p>
        </div>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel
            disabled={isDeleting}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction
            disabled={isDeleting || !isDeleteConfirmMatch}
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            type="button"
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete integration"}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
