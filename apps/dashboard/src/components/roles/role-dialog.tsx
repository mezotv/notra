"use client";

import type { OrganizationScope } from "@notra/db/types/roles";
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
import { useCreateRole, useUpdateRole } from "@/lib/hooks/use-roles";
import { errorMessageOr } from "@/lib/utils";
import type { RoleDialogProps } from "@/types/settings/roles";
import { RoleScopePicker } from "./scope-picker";

export function RoleDialog({
  open,
  onOpenChange,
  organizationId,
  scopeGroups,
  role,
}: RoleDialogProps) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [scopes, setScopes] = useState<OrganizationScope[]>(role?.scopes ?? []);

  const createRole = useCreateRole(organizationId);
  const updateRole = useUpdateRole(organizationId);
  const isPending = createRole.isPending || updateRole.isPending;

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const canSubmit =
    !!organizationId && trimmedName.length > 0 && scopes.length > 0;
  const submitLabel = role ? "Save changes" : "Create role";

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Enter a name and select at least one permission.");
      return;
    }

    const onError = (error: Error) => {
      toast.error(errorMessageOr(error.message, "Failed to save role"));
    };

    if (role) {
      updateRole.mutate(
        {
          roleId: role.id,
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

    createRole.mutate(
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
            {role ? "Edit role" : "Create role"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Roles bundle permissions you can assign to members of this
            organization.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              disabled={isPending}
              id="role-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Content reviewer"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              disabled={isPending}
              id="role-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this role is allowed to do"
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
              <RoleScopePicker
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
