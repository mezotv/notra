"use client";

import {
  Add01Icon,
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
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@notra/ui/components/ui/radio-group";
import { cn } from "@notra/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useId, useState } from "react";

import { Button } from "@/components/button";
import { dashboardOrpc } from "@/lib/orpc/query";
import { repositoryContentDirectorySchema } from "@/schemas/integrations";
import type {
  GitHubDirectoryChoiceProps,
  GitHubDirectoryNodeProps,
  GitHubDirectoryPickerProps,
} from "@/types/integrations/github";
import {
  joinGitHubDirectory,
  normalizeGitHubDirectorySegment,
} from "@/utils/github-directory";

function DirectoryChoice({
  depth,
  helper,
  name,
  path,
}: GitHubDirectoryChoiceProps) {
  const radioId = useId();

  return (
    <label
      className="hover:bg-muted/60 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg py-2 pe-2 text-sm"
      htmlFor={radioId}
      style={{ paddingInlineStart: `${depth * 16 + 12}px` }}
    >
      <RadioGroupItem id={radioId} value={path} />
      <HugeiconsIcon
        className="text-muted-foreground size-4 shrink-0"
        icon={Folder01Icon}
      />
      <span className="min-w-0">
        <span className="block truncate">{name}</span>
        {helper ? (
          <span className="text-muted-foreground block text-xs">{helper}</span>
        ) : null}
      </span>
    </label>
  );
}

function DirectoryNode({
  depth,
  excludedPath,
  missing = false,
  name,
  open,
  organizationId,
  path,
  repositoryId,
}: GitHubDirectoryNodeProps) {
  const radioId = useId();
  const [expanded, setExpanded] = useState(false);
  const directoriesQuery = useQuery(
    dashboardOrpc.integrations.repositories.directories.list.queryOptions({
      input: { organizationId, repositoryId, directory: path },
      enabled: open && expanded && !missing,
      staleTime: 5 * 60 * 1000,
    })
  );

  if (missing) {
    return (
      <DirectoryChoice
        depth={depth}
        helper="This folder is not in the repository yet. It will be created when you publish."
        name={name}
        path={path}
      />
    );
  }
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
  } else if (directoriesQuery.data?.exists === false) {
    directoryContent = (
      <p
        className="text-muted-foreground py-2 text-sm"
        style={{ paddingInlineStart: `${(depth + 1) * 16 + 44}px` }}
      >
        This folder is not in the repository yet. It will be created when you
        publish.
      </p>
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
  const newFolderInputId = useId();
  const [open, setOpen] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState(directory);
  const [customDirectories, setCustomDirectories] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const rootDirectoriesQuery = useQuery(
    dashboardOrpc.integrations.repositories.directories.list.queryOptions({
      input: { organizationId, repositoryId, directory: "" },
      enabled: open && Boolean(repositoryId),
      staleTime: 5 * 60 * 1000,
    })
  );
  const rootDirectories = rootDirectoriesQuery.data?.directories ?? [];
  const currentFolderMissing =
    Boolean(directory) &&
    !directory.includes("/") &&
    rootDirectoriesQuery.isSuccess &&
    !rootDirectories.some((rootDirectory) => rootDirectory.path === directory);
  const extraDirectories = customDirectories.filter(
    (path) =>
      path !== "" &&
      path !== directory &&
      !rootDirectories.some((rootDirectory) => rootDirectory.path === path)
  );
  let rootDirectoryContent: ReactNode = rootDirectories
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
      setCustomDirectories([]);
      setNewFolderName("");
      setNewFolderError(null);
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

  const handleCreateFolder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const folderName = normalizeGitHubDirectorySegment(newFolderName);
    if (!folderName) {
      setNewFolderError("Enter a folder name");
      return;
    }

    const nextDirectory = joinGitHubDirectory(selectedDirectory, folderName);
    const parsed = repositoryContentDirectorySchema.safeParse(nextDirectory);
    if (!parsed.success) {
      setNewFolderError(
        parsed.error.issues[0]?.message ?? "Enter a valid folder path"
      );
      return;
    }

    setSelectedDirectory(parsed.data);
    setCustomDirectories((current) =>
      current.includes(parsed.data) ? current : [...current, parsed.data]
    );
    setNewFolderName("");
    setNewFolderError(null);
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
            {repositoryName}. Missing folders are created when you publish.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <RadioGroup
          aria-label={`${contentLabel} folder`}
          className="my-4 max-h-[420px] gap-0 overflow-y-auto rounded-xl border p-1"
          onValueChange={(value) => {
            if (typeof value === "string") {
              setSelectedDirectory(value);
              setNewFolderError(null);
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
              missing={currentFolderMissing}
              name={`${directory} (current folder)`}
              open={open}
              organizationId={organizationId}
              path={directory}
              repositoryId={repositoryId}
            />
          ) : null}

          {extraDirectories.map((path) => (
            <DirectoryChoice
              depth={0}
              helper="This folder will be created when you publish."
              key={path}
              name={`${path} (new folder)`}
              path={path}
            />
          ))}

          {rootDirectoryContent}
        </RadioGroup>

        <form className="space-y-2" onSubmit={handleCreateFolder}>
          <Field data-invalid={newFolderError ? true : undefined}>
            <FieldLabel htmlFor={newFolderInputId}>New folder</FieldLabel>
            <div className="flex gap-2">
              <Input
                aria-invalid={Boolean(newFolderError)}
                autoComplete="off"
                className="w-auto min-w-0 flex-1"
                id={newFolderInputId}
                onChange={(event) => {
                  setNewFolderName(event.target.value);
                  if (newFolderError) {
                    setNewFolderError(null);
                  }
                }}
                placeholder={
                  selectedDirectory
                    ? `Folder inside ${selectedDirectory}`
                    : "e.g. changelogs"
                }
                value={newFolderName}
              />
              <Button
                className="shrink-0"
                disabled={!normalizeGitHubDirectorySegment(newFolderName)}
                size="sm"
                type="submit"
                variant="outline"
              >
                <HugeiconsIcon className="size-4" icon={Add01Icon} />
                Add
              </Button>
            </div>
            {newFolderError ? (
              <FieldError>{newFolderError}</FieldError>
            ) : (
              <FieldDescription className="text-xs">
                Added relative to the selected folder. It does not need to exist
                in GitHub yet.
              </FieldDescription>
            )}
          </Field>
        </form>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            disabled={isSaving}
            render={<Button type="button" variant="outline" />}
          >
            Cancel
          </ResponsiveDialogClose>
          <Button disabled={isSaving} onClick={handleSave} type="button">
            {isSaving ? "Saving…" : "Use folder"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
