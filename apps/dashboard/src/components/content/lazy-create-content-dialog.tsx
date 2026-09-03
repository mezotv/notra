"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useHotkey } from "@tanstack/react-hotkeys";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { CreateContentButton } from "@/components/content/create-content-button";
import {
  loadCreateContentDialog,
  preloadCreateContentDialog,
} from "@/components/content/create-content-dialog-loader";
import type { ContentCreateEntry } from "@/types/analytics/studio-events";
import type { LazyCreateContentDialogProps } from "@/types/content/create";

const CreateContentDialog = dynamic(loadCreateContentDialog, {
  loading: () => null,
  ssr: false,
});

function CreateContentDialogLoading({
  onOpenChange,
}: Pick<LazyCreateContentDialogProps, "onOpenChange">) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open>
      <ResponsiveDialogContent className="flex h-[85vh] max-h-[85vh] flex-col sm:max-w-4xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create Content</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Loading the content creation workflow.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div aria-live="polite" className="space-y-4" role="status">
          <Skeleton aria-hidden className="h-10 w-full" />
          <Skeleton aria-hidden className="min-h-64 flex-1" />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function LazyCreateContentDialog({
  enableHotkey = true,
  organizationId,
  entry,
  hideTrigger = false,
  onOpenChange,
  open: controlledOpen,
}: LazyCreateContentDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isDialogReady, setIsDialogReady] = useState(false);
  const [entryOverride, setEntryOverride] = useState<ContentCreateEntry | null>(
    null
  );
  const open = controlledOpen ?? uncontrolledOpen;
  const openEntry = entryOverride ?? entry;
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setEntryOverride(null);
      }
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange]
  );

  useEffect(() => {
    if (!(open && !isDialogReady)) {
      return;
    }

    let active = true;
    async function prepareCreateContentDialog() {
      try {
        await loadCreateContentDialog();
        if (active) {
          setIsDialogReady(true);
        }
      } catch {
        // Keep the loading state so a future open can retry.
      }
    }
    void prepareCreateContentDialog();
    return () => {
      active = false;
    };
  }, [isDialogReady, open]);

  useHotkey(
    "C",
    () => {
      if (
        organizationId &&
        !document.querySelector('[role="dialog"][data-open]')
      ) {
        setEntryOverride("hotkey");
        setOpen(true);
      }
    },
    { enabled: enableHotkey && !open }
  );

  return (
    <>
      {hideTrigger ? null : (
        <CreateContentButton
          disabled={!organizationId}
          onClick={() => {
            setEntryOverride(null);
            setOpen(true);
          }}
          onFocus={preloadCreateContentDialog}
          onMouseEnter={preloadCreateContentDialog}
        />
      )}
      {open && !isDialogReady ? (
        <CreateContentDialogLoading onOpenChange={setOpen} />
      ) : null}
      {isDialogReady ? (
        <CreateContentDialog
          enableHotkey={false}
          entry={openEntry}
          hideTrigger
          onOpenChange={setOpen}
          open={open}
          organizationId={organizationId}
        />
      ) : null}
    </>
  );
}
