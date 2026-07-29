"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { DeleteRoleDialog } from "@/components/roles/delete-role-dialog";
import { RoleDialog } from "@/components/roles/role-dialog";
import { RoleList } from "@/components/roles/role-list";
import { useMemberPermissions } from "@/lib/hooks/use-member-permissions";
import { useRoles } from "@/lib/hooks/use-roles";
import { useSlugOrganization } from "@/lib/hooks/use-slug-organization";
import { buildScopeLabels } from "@/lib/roles/scopes";
import type { OrganizationRoleSummary } from "@/types/settings/roles";
import { RolesSettingsSkeleton } from "./skeleton";

export default function RolesPageClient() {
  const organization = useSlugOrganization();
  const organizationId = organization?.id ?? "";

  const { hasScope } = useMemberPermissions(organizationId);
  const { data, isPending } = useRoles(organizationId);

  const [dialogRole, setDialogRole] = useState<OrganizationRoleSummary | null>(
    null
  );
  const [dialogNonce, setDialogNonce] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] =
    useState<OrganizationRoleSummary | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const scopeGroups = data?.scopeGroups ?? [];
  const scopeLabels = buildScopeLabels(scopeGroups);
  const canManage = hasScope("roles:manage");

  const openDialog = (role: OrganizationRoleSummary | null) => {
    setDialogRole(role);
    setDialogNonce((nonce) => nonce + 1);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (role: OrganizationRoleSummary) => {
    setRoleToDelete(role);
    setIsDeleteOpen(true);
  };

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Roles</h1>
            <p className="text-muted-foreground">
              Bundle permissions into roles and assign them to members
            </p>
          </div>
          {canManage && (
            <Button onClick={() => openDialog(null)}>
              <HugeiconsIcon className="size-4" icon={Add01Icon} />
              Create role
            </Button>
          )}
        </div>

        {organization ? (
          <RoleList
            canManage={canManage}
            isLoading={isPending}
            onDelete={openDeleteDialog}
            onEdit={openDialog}
            roles={data?.roles ?? []}
            scopeLabels={scopeLabels}
          />
        ) : (
          <RolesSettingsSkeleton />
        )}

        {!canManage && (
          <p className="text-muted-foreground text-xs">
            You need the roles permission to create or edit roles.
          </p>
        )}
      </div>

      {canManage && organizationId && (
        <>
          <RoleDialog
            key={`${dialogRole?.id ?? "create"}-${dialogNonce}`}
            onOpenChange={setIsDialogOpen}
            open={isDialogOpen}
            organizationId={organizationId}
            role={dialogRole}
            scopeGroups={scopeGroups}
          />
          <DeleteRoleDialog
            onOpenChange={setIsDeleteOpen}
            open={isDeleteOpen}
            organizationId={organizationId}
            role={roleToDelete}
          />
        </>
      )}
    </PageContainer>
  );
}
