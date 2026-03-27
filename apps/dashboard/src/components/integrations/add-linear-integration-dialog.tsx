"use client";

import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import type React from "react";
import { isValidElement, useState } from "react";

interface AddLinearIntegrationDialogProps {
  authorizeUrl: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddLinearIntegrationDialog({
  authorizeUrl,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: AddLinearIntegrationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const triggerElement =
    trigger && isValidElement(trigger) ? (
      <ResponsiveDialogTrigger render={trigger as React.ReactElement} />
    ) : null;

  return (
    <ResponsiveDialog onOpenChange={setOpen} open={open}>
      {triggerElement}
      <ResponsiveDialogContent className="sm:max-w-[480px]">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-3">
            <Linear className="size-8" />
            <ResponsiveDialogTitle className="text-2xl">
              Connect Linear
            </ResponsiveDialogTitle>
          </div>
          <ResponsiveDialogDescription>
            Connect your Linear workspace to sync issues and updates for
            AI-powered content generation.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-3 py-4">
          <p className="text-muted-foreground text-sm">
            You will be redirected to Linear to authorize access to your
            workspace. Once authorized, your integration will be created
            automatically.
          </p>
        </div>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose render={<Button variant="outline" />}>
            Cancel
          </ResponsiveDialogClose>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90"
            href={authorizeUrl}
          >
            Connect with Linear
            <HugeiconsIcon className="size-4" icon={ArrowRight02Icon} />
          </a>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
