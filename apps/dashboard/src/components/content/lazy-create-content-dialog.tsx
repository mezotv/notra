"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import dynamic from "next/dynamic";
import { useState } from "react";
import { CreateContentButton } from "@/components/content/create-content-button";

const loadCreateContentDialog = () =>
  import("@/components/content/create-content-dialog").then(
    (mod) => mod.CreateContentDialog
  );

const CreateContentDialog = dynamic(loadCreateContentDialog, { ssr: false });

interface LazyCreateContentDialogProps {
  organizationId: string;
}

export function LazyCreateContentDialog({
  organizationId,
}: LazyCreateContentDialogProps) {
  const [open, setOpen] = useState(false);

  useHotkey(
    "C",
    () => {
      if (organizationId) {
        setOpen(true);
      }
    },
    { enabled: !open }
  );

  return (
    <>
      <CreateContentButton
        disabled={!organizationId}
        onClick={() => setOpen(true)}
        onFocus={() => {
          loadCreateContentDialog();
        }}
        onMouseEnter={() => {
          loadCreateContentDialog();
        }}
      />
      {open && (
        <CreateContentDialog
          hideTrigger
          onOpenChange={setOpen}
          open={open}
          organizationId={organizationId}
        />
      )}
    </>
  );
}
