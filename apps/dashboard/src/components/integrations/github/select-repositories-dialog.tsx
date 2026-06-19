"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
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
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import type React from "react";
import { isValidElement, useEffect, useState } from "react";
import { Button } from "@/components/button";
import type { SelectRepositoriesDialogProps } from "@/types/integrations/github";
import { RepositoryMultiSelect } from "./repository-multi-select";

const EMPTY_SELECTED_REPOSITORY_IDS: string[] = [];

export function SelectRepositoriesDialog({
  repositories,
  onSave,
  initialSelected = EMPTY_SELECTED_REPOSITORY_IDS,
  isLoading = false,
  isSaving = false,
  accounts,
  selectedAccountId,
  onSelectAccount,
  onAddAccount,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: SelectRepositoriesDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [selected, setSelected] = useState<string[]>(initialSelected);

  useEffect(() => {
    if (open) {
      setSelected(initialSelected);
    }
  }, [open, initialSelected]);

  const triggerElement =
    trigger && isValidElement(trigger) ? (
      <ResponsiveDialogTrigger render={trigger as React.ReactElement} />
    ) : null;

  return (
    <ResponsiveDialog onOpenChange={setOpen} open={open}>
      {triggerElement}
      <ResponsiveDialogContent className="sm:max-w-[520px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Select repositories</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Choose which repositories Notra should generate content from. Only
            repositories granted to the GitHub App appear here.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-3 py-4">
          <Field>
            <FieldLabel>Repositories</FieldLabel>
            <RepositoryMultiSelect
              accounts={accounts}
              isLoading={isLoading}
              onAddAccount={onAddAccount}
              onChange={setSelected}
              onSelectAccount={onSelectAccount}
              repositories={repositories}
              selectedAccountId={selectedAccountId}
              value={selected}
            />
          </Field>
          {onAddAccount ? (
            <button
              className="inline-flex items-center gap-1 text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
              onClick={onAddAccount}
              type="button"
            >
              Missing a repository? Add access on GitHub
              <HugeiconsIcon className="size-3" icon={ArrowUpRight01Icon} />
            </button>
          ) : null}
        </div>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            disabled={isSaving}
            render={<Button variant="outline" />}
          >
            Cancel
          </ResponsiveDialogClose>
          <Button
            disabled={isSaving || isLoading}
            onClick={() => onSave(selected)}
          >
            {isSaving ? "Saving…" : "Save repositories"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
