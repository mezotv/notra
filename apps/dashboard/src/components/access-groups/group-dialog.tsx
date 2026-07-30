"use client";

import type { OrganizationScope } from "@notra/db/types/access-groups";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  useCreateAccessGroup,
  useUpdateAccessGroup,
} from "@/lib/hooks/use-access-groups";
import { errorMessageOr } from "@/lib/utils";
import type { AccessGroupDialogProps } from "@/types/settings/access-groups";
import { AccessGroupScopePicker } from "./scope-picker";

export function AccessGroupDialog({
  open,
  onOpenChange,
  organizationId,
  scopeGroups,
  accessGroup,
}: AccessGroupDialogProps) {
  const [name, setName] = useState(accessGroup?.name ?? "");
  const [description, setDescription] = useState(
    accessGroup?.description ?? ""
  );
  const [scopes, setScopes] = useState<OrganizationScope[]>(
    accessGroup?.scopes ?? []
  );

  const createAccessGroup = useCreateAccessGroup(organizationId);
  const updateAccessGroup = useUpdateAccessGroup(organizationId);
  const isPending = createAccessGroup.isPending || updateAccessGroup.isPending;

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const canSubmit =
    !!organizationId && trimmedName.length > 0 && scopes.length > 0;
  const submitLabel = accessGroup ? "Save changes" : "Create access group";

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Enter a name and select at least one permission.");
      return;
    }

    const onError = (error: Error) => {
      toast.error(errorMessageOr(error.message, "Failed to save access group"));
    };

    if (accessGroup) {
      updateAccessGroup.mutate(
        {
          accessGroupId: accessGroup.id,
          name: trimmedName,
          description: trimmedDescription === "" ? null : trimmedDescription,
          scopes,
        },
        {
          onSuccess: () => {
            toast.success(`${trimmedName} has been updated`);
            onOpenChange(false);
          },
          onError,
        }
      );
      return;
    }

    createAccessGroup.mutate(
      {
        name: trimmedName,
        description: trimmedDescription === "" ? undefined : trimmedDescription,
        scopes,
      },
      {
        onSuccess: () => {
          toast.success(`${trimmedName} has been created`);
          onOpenChange(false);
        },
        onError,
      }
    );
  };

  return (
    <ResponsiveDialog
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          onOpenChange(nextOpen);
        }
      }}
      open={open}
    >
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {accessGroup ? "Edit access group" : "Create access group"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Access groups bundle permissions you can assign to members of this
            workspace.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-group-name">Name</Label>
            <Input
              disabled={isPending}
              id="access-group-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Content reviewer"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-group-description">Description</Label>
            <Textarea
              disabled={isPending}
              id="access-group-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this access group is allowed to do"
              rows={2}
              value={description}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <span className="text-muted-foreground text-xs">
                {scopes.length} selected
              </span>
            </div>
            <div className="max-h-[18rem] overflow-y-auto">
              <AccessGroupScopePicker
                disabled={isPending}
                groups={scopeGroups}
                onValueChange={setScopes}
                value={scopes}
              />
            </div>
          </div>
        </div>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            disabled={isPending}
            render={
              <Button
                className="w-full justify-center sm:w-auto"
                variant="outline"
              />
            }
          >
            Cancel
          </ResponsiveDialogClose>
          <Button
            className="w-full justify-center sm:w-auto"
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
            type="button"
          >
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
