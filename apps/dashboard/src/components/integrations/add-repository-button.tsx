"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { useState } from "react";
import type { AddRepositoryButtonProps } from "@/types/integrations";
import { AddIntegrationDialog } from "./add-integration-dialog";
import { AddRepositoryDialog } from "./add-repository-dialog";

export function AddRepositoryButton({
  organizationId,
  githubIntegrationId,
  onOpenDialog,
  onCloseDialog,
}: AddRepositoryButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onCloseDialog?.();
    }
  };

  return (
    <>
      <Button
        className="h-6 shrink-0 gap-1 rounded px-2 text-xs"
        onClick={() => {
          onOpenDialog?.();
          setOpen(true);
        }}
        size="sm"
        type="button"
      >
        <HugeiconsIcon className="size-3" icon={Add01Icon} />
        Add
      </Button>
      {githubIntegrationId ? (
        <AddRepositoryDialog
          integrationId={githubIntegrationId}
          onOpenChange={handleOpenChange}
          open={open}
          organizationId={organizationId}
        />
      ) : (
        <AddIntegrationDialog
          onOpenChange={handleOpenChange}
          open={open}
          organizationId={organizationId}
        />
      )}
    </>
  );
}
