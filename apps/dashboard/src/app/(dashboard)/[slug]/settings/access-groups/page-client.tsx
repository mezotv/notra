"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { DeleteAccessGroupDialog } from "@/components/access-groups/delete-group-dialog";
import { AccessGroupDialog } from "@/components/access-groups/group-dialog";
import { AccessGroupList } from "@/components/access-groups/group-list";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { buildScopeLabels } from "@/lib/access-groups/scopes";
import { useAccessGroups } from "@/lib/hooks/use-access-groups";
import { useMemberPermissions } from "@/lib/hooks/use-member-permissions";
import { useSlugOrganization } from "@/lib/hooks/use-slug-organization";
import type { AccessGroupSummary } from "@/types/settings/access-groups";
import { AccessGroupsSettingsSkeleton } from "./skeleton";

export default function AccessGroupsPageClient() {
  const organization = useSlugOrganization();
  const organizationId = organization?.id ?? "";

  const { hasScope } = useMemberPermissions(organizationId);
  const { data, isPending } = useAccessGroups(organizationId);

  const [dialogGroup, setDialogGroup] = useState<AccessGroupSummary | null>(
    null
  );
  const [dialogNonce, setDialogNonce] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<AccessGroupSummary | null>(
    null
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const scopeGroups = data?.scopeGroups ?? [];
  const scopeLabels = buildScopeLabels(scopeGroups);
  const canManage = hasScope("roles:manage");

  const openDialog = (accessGroup: AccessGroupSummary | null) => {
    setDialogGroup(accessGroup);
    setDialogNonce((nonce) => nonce + 1);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (accessGroup: AccessGroupSummary) => {
    setGroupToDelete(accessGroup);
    setIsDeleteOpen(true);
  };

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Access groups</h1>
            <p className="text-muted-foreground">
              Bundle permissions into access groups and assign them to members
            </p>
          </div>
          {canManage && (
            <Button onClick={() => openDialog(null)}>
              <HugeiconsIcon className="size-4" icon={Add01Icon} />
              Create access group
            </Button>
          )}
        </div>

        {organization ? (
          <AccessGroupList
            accessGroups={data?.accessGroups ?? []}
            canManage={canManage}
            isLoading={isPending}
            onDelete={openDeleteDialog}
            onEdit={openDialog}
            scopeLabels={scopeLabels}
          />
        ) : (
          <AccessGroupsSettingsSkeleton />
        )}

        {!canManage && (
          <p className="text-muted-foreground text-xs">
            You need permission to manage access groups.
          </p>
        )}
      </div>

      {canManage && organizationId && (
        <>
          <AccessGroupDialog
            accessGroup={dialogGroup}
            key={`${dialogGroup?.id ?? "create"}-${dialogNonce}`}
            onOpenChange={setIsDialogOpen}
            open={isDialogOpen}
            organizationId={organizationId}
            scopeGroups={scopeGroups}
          />
          <DeleteAccessGroupDialog
            accessGroup={groupToDelete}
            onOpenChange={setIsDeleteOpen}
            open={isDeleteOpen}
            organizationId={organizationId}
          />
        </>
      )}
    </PageContainer>
  );
}
