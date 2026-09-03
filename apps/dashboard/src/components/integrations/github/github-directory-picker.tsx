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
  excludedPath,
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
  let directoryContent: ReactNode = directoriesQuery.data?.directories
    .filter((directory) => directory.path !== excludedPath)
    .map((directory) => (
      <DirectoryNode
        depth={depth + 1}
        excludedPath={excludedPath}
        key={directory.path}
        name={directory.name}
        open={open}
        organizationId={organizationId}
        path={directory.path}
        repositoryId={repositoryId}
      />
    ));

  if (directoriesQuery.isLoading) {
    directoryContent = (
      <output
        className="text-muted-foreground flex h-10 items-center gap-2 text-sm"
        style={{ paddingInlineStart: `${(depth + 1) * 16 + 44}px` }}
      >
        <HugeiconsIcon className="size-4 animate-spin" icon={Loading03Icon} />
        Loading…
      </output>
    );
  } else if (directoriesQuery.isError) {
    directoryContent = (
      <p
        className="text-destructive py-2 text-sm"
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
        className="hover:bg-muted/60 flex min-h-10 items-center gap-1 rounded-lg pe-2"
        style={{ paddingInlineStart: `${depth * 16 + 4}px` }}
      >
        <CollapsibleTrigger
          aria-label={expanded ? `Collapse ${name}` : `Expand ${name}`}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-1"
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
            className="text-muted-foreground size-4 shrink-0"
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
  contentLabel,
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
  let rootDirectoryContent: ReactNode = rootDirectoriesQuery.data?.directories
    .filter((rootDirectory) => rootDirectory.path !== directory)
    .map((rootDirectory) => (
      <DirectoryNode
        depth={0}
        excludedPath={directory}
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
      <output className="text-muted-foreground flex h-20 items-center justify-center gap-2 text-sm">
        <HugeiconsIcon className="size-4 animate-spin" icon={Loading03Icon} />
        Loading folders…
      </output>
    );
  } else if (rootDirectoriesQuery.isError) {
    rootDirectoryContent = (
      <p
        className="text-destructive px-3 py-6 text-center text-sm"
        role="alert"
      >
        Unable to load repository folders.
      </p>
    );
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) {
      return;
    }
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
            aria-label={`${contentLabel} folder: ${directory || "Repository root"}. Browse folders`}
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
            className="text-muted-foreground size-4 shrink-0"
            icon={Folder01Icon}
          />
          <span className="truncate">{directory || "Repository root"}</span>
        </span>
        <span className="text-muted-foreground shrink-0 text-xs">Browse</span>
      </ResponsiveDialogTrigger>

      <ResponsiveDialogContent className="sm:max-w-[600px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Choose {contentLabel.toLowerCase()} folder
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {repositoryName}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <RadioGroup
          aria-label={`${contentLabel} folder`}
          className="my-4 max-h-[420px] gap-0 overflow-y-auto rounded-xl border p-1"
          onValueChange={(value) => {
            if (typeof value === "string") {
              setSelectedDirectory(value);
            }
          }}
          value={selectedDirectory}
        >
          <label
            className="hover:bg-muted/60 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
            htmlFor={rootRadioId}
          >
            <RadioGroupItem id={rootRadioId} value="" />
            <HugeiconsIcon
              className="text-muted-foreground size-4 shrink-0"
              icon={Folder01Icon}
            />
            <span>{repositoryName} (root)</span>
          </label>

          {directory ? (
            <DirectoryNode
              depth={0}
              excludedPath={directory}
              name={`${directory} (current folder)`}
              open={open}
              organizationId={organizationId}
              path={directory}
              repositoryId={repositoryId}
            />
          ) : null}

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
