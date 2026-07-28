"use client";

import {
  ArrowRight01Icon,
  Folder01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import {
  RadioGroup,
  RadioGroupItem,
} from "@notra/ui/components/ui/radio-group";
import { cn } from "@notra/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/button";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  GitHubDirectoryNodeProps,
  GitHubDirectoryPickerProps,
} from "@/types/integrations/github";

function DirectoryNode({
  depth,
  name,
  open,
  organizationId,
  path,
  repositoryId,
}: GitHubDirectoryNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const directoriesQuery = useQuery(
    dashboardOrpc.integrations.repositories.directories.list.queryOptions({
      input: { organizationId, repositoryId, directory: path },
      enabled: open && expanded,
      staleTime: 5 * 60 * 1000,
    })
  );
  const radioId = useId();
  let directoryContent: ReactNode = directoriesQuery.data?.directories.map(
    (directory) => (
      <DirectoryNode
        depth={depth + 1}
        key={directory.path}
        name={directory.name}
        open={open}
        organizationId={organizationId}
        path={directory.path}
        repositoryId={repositoryId}
      />
    )
  );

  if (directoriesQuery.isLoading) {
    directoryContent = (
      <output
        className="flex h-10 items-center gap-2 text-muted-foreground text-sm"
        style={{ paddingInlineStart: `${(depth + 1) * 16 + 44}px` }}
      >
        <HugeiconsIcon className="size-4 animate-spin" icon={Loading03Icon} />
        Loading…
      </output>
    );
  } else if (directoriesQuery.isError) {
    directoryContent = (
      <p
        className="py-2 text-destructive text-sm"
        role="alert"
        style={{ paddingInlineStart: `${(depth + 1) * 16 + 44}px` }}
      >
        Unable to load this folder.
      </p>
    );
  }

  return (
    <Collapsible onOpenChange={setExpanded} open={expanded}>
      <div
        className="flex min-h-10 items-center gap-1 rounded-lg pe-2 hover:bg-muted/60"
        style={{ paddingInlineStart: `${depth * 16 + 4}px` }}
      >
        <CollapsibleTrigger
          aria-label={expanded ? `Collapse ${name}` : `Expand ${name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
        >
          <HugeiconsIcon
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-90"
            )}
            icon={ArrowRight01Icon}
          />
        </CollapsibleTrigger>
        <label
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 text-sm"
          htmlFor={radioId}
        >
          <RadioGroupItem id={radioId} value={path} />
          <HugeiconsIcon
            className="size-4 shrink-0 text-muted-foreground"
            icon={Folder01Icon}
          />
          <span className="truncate">{name}</span>
        </label>
      </div>

      <CollapsibleContent>{directoryContent}</CollapsibleContent>
    </Collapsible>
  );
}

export function GitHubDirectoryPicker({
  directory,
  disabled = false,
  isSaving = false,
  onSave,
  organizationId,
  repositoryId,
  repositoryName,
  triggerId,
}: GitHubDirectoryPickerProps) {
  const rootRadioId = useId();
  const [open, setOpen] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState(directory);
  const rootDirectoriesQuery = useQuery(
    dashboardOrpc.integrations.repositories.directories.list.queryOptions({
      input: { organizationId, repositoryId, directory: "" },
      enabled: open && Boolean(repositoryId),
      staleTime: 5 * 60 * 1000,
    })
  );
  let rootDirectoryContent: ReactNode =
    rootDirectoriesQuery.data?.directories.map((rootDirectory) => (
      <DirectoryNode
        depth={0}
        key={rootDirectory.path}
        name={rootDirectory.name}
        open={open}
        organizationId={organizationId}
        path={rootDirectory.path}
        repositoryId={repositoryId}
      />
    ));

  if (rootDirectoriesQuery.isLoading) {
    rootDirectoryContent = (
      <output className="flex h-20 items-center justify-center gap-2 text-muted-foreground text-sm">
        <HugeiconsIcon className="size-4 animate-spin" icon={Loading03Icon} />
        Loading folders…
      </output>
    );
  } else if (rootDirectoriesQuery.isError) {
    rootDirectoryContent = (
      <p
        className="px-3 py-6 text-center text-destructive text-sm"
        role="alert"
      >
        Unable to load repository folders.
      </p>
    );
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelectedDirectory(directory);
    }
  };

  const handleSave = async () => {
    try {
      await onSave(selectedDirectory);
      handleOpenChange(false);
    } catch {
      // The parent mutation keeps the dialog open and surfaces the error.
    }
  };

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogTrigger
        render={
          <Button
            aria-label={`Changelog folder: ${directory || "Repository root"}. Browse folders`}
            className="h-10 w-full justify-between px-3 font-normal"
            disabled={disabled}
            id={triggerId}
            type="button"
            variant="outline"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <HugeiconsIcon
            className="size-4 shrink-0 text-muted-foreground"
            icon={Folder01Icon}
          />
          <span className="truncate">{directory || "Repository root"}</span>
        </span>
        <span className="shrink-0 text-muted-foreground text-xs">Browse</span>
      </ResponsiveDialogTrigger>

      <ResponsiveDialogContent className="sm:max-w-[600px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Choose changelog folder</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {repositoryName}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <RadioGroup
          aria-label="Changelog folder"
          className="my-4 max-h-[420px] gap-0 overflow-y-auto rounded-xl border p-1"
          onValueChange={(value) => {
            if (typeof value === "string") {
              setSelectedDirectory(value);
            }
          }}
          value={selectedDirectory}
        >
          <label
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/60"
            htmlFor={rootRadioId}
          >
            <RadioGroupItem id={rootRadioId} value="" />
            <HugeiconsIcon
              className="size-4 shrink-0 text-muted-foreground"
              icon={Folder01Icon}
            />
            <span>{repositoryName} (root)</span>
          </label>

          {rootDirectoryContent}
        </RadioGroup>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            disabled={isSaving}
            render={<Button type="button" variant="outline" />}
          >
            Cancel
          </ResponsiveDialogClose>
          <Button
            disabled={isSaving || rootDirectoriesQuery.isLoading}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? "Saving…" : "Use folder"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
