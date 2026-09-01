"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/button";
import type { IrisPauseDialogProps } from "@/types/iris";

export function IrisPauseDialog({
  open,
  isPausing,
  onOpenChange,
  onConfirm,
}: IrisPauseDialogProps) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Pause Iris?</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Pausing stops scheduled runs and cancels pending Slack messages. You
            can resume at any time.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button
            disabled={isPausing}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Keep running
          </Button>
          <Button disabled={isPausing} onClick={onConfirm}>
            {isPausing ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Pausing
              </>
            ) : (
              "Pause Iris"
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
