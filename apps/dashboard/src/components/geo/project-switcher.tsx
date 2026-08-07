"use client";

import {
  ArrowDown01Icon,
  Folder01Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { useGeoProjectCreate } from "@/lib/hooks/use-geo";
import type {
  GeoProjectCreateDialogProps,
  GeoProjectSwitcherProps,
} from "@/types/geo";

function GeoProjectCreateDialog({
  open,
  onOpenChange,
  organizationId,
  onCreated,
}: GeoProjectCreateDialogProps) {
  const nameId = useId();
  const [name, setName] = useState("");
  const createProject = useGeoProjectCreate(organizationId);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
    }
    onOpenChange(next);
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || createProject.isPending) {
      return;
    }
    const project = await createProject.mutateAsync({ name: trimmed });
    setName("");
    onOpenChange(false);
    onCreated(project.id);
  };

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>New project</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Track a separate website or brand with its own prompts, competitors
            and visibility data.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-2 px-4 sm:px-0">
          <Label htmlFor={nameId}>Project name</Label>
          <Input
            autoFocus
            id={nameId}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Acme"
            value={name}
          />
        </div>
        <ResponsiveDialogFooter>
          <Button
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={name.trim().length === 0 || createProject.isPending}
            onClick={handleCreate}
            type="button"
          >
            {createProject.isPending && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            Create project
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function GeoProjectSwitcher({
  organizationId,
  projects,
  activeProjectId,
  onProjectChange,
}: GeoProjectSwitcherProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ??
    projects.at(0) ??
    null;

  if (projects.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          <HugeiconsIcon icon={Folder01Icon} size={16} />
          <span className="max-w-40 truncate">
            {activeProject?.name ?? "Project"}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onSelect={() =>
                onProjectChange(project.isDefault ? null : project.id)
              }
            >
              <span className="flex-1 truncate">{project.name}</span>
              {project.id === activeProject?.id && (
                <HugeiconsIcon icon={Tick02Icon} size={16} />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            New project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <GeoProjectCreateDialog
        onCreated={(projectId) => onProjectChange(projectId)}
        onOpenChange={setCreateOpen}
        open={createOpen}
        organizationId={organizationId}
      />
    </>
  );
}
