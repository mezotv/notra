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
import type { LazyCreateContentDialogProps } from "@/types/content/create";

const loadCreateContentDialog = () =>
  import("@/components/content/create-content-dialog").then(
    (mod) => mod.CreateContentDialog
  );

const CreateContentDialog = dynamic(loadCreateContentDialog, {
  loading: () => null,
  ssr: false,
});

export function preloadCreateContentDialog(): void {
  void loadCreateContentDialog().catch(() => undefined);
}

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
  const [hasOpened, setHasOpened] = useState(false);
  const [isDialogReady, setIsDialogReady] = useState(false);
  const [openEntry, setOpenEntry] = useState(entry);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange]
  );

  useEffect(() => {
    if (open) {
      setHasOpened(true);
      return;
    }
    setOpenEntry(entry);
  }, [entry, open]);

  useEffect(() => {
    if (!(hasOpened && !isDialogReady)) {
      return;
    }

    let active = true;
    void loadCreateContentDialog()
      .then(() => {
        if (active) {
          setIsDialogReady(true);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [hasOpened, isDialogReady]);

  useHotkey(
    "C",
    () => {
      if (
        organizationId &&
        !document.querySelector('[role="dialog"][data-open]')
      ) {
        setOpenEntry("hotkey");
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
            setOpenEntry(entry);
            setOpen(true);
          }}
          onFocus={preloadCreateContentDialog}
          onMouseEnter={preloadCreateContentDialog}
        />
      )}
      {open && !isDialogReady ? (
        <CreateContentDialogLoading onOpenChange={setOpen} />
      ) : null}
      {hasOpened && isDialogReady ? (
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
