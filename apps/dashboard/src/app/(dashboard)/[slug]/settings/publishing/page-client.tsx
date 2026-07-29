"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { DeleteWorkflowDialog } from "@/components/publishing/delete-workflow-dialog";
import { WorkflowDialog } from "@/components/publishing/workflow-dialog";
import { WorkflowList } from "@/components/publishing/workflow-list";
import { useApprovalWorkflows } from "@/lib/hooks/use-approval-workflows";
import { useMemberPermissions } from "@/lib/hooks/use-member-permissions";
import { useRoles } from "@/lib/hooks/use-roles";
import { useSlugOrganization } from "@/lib/hooks/use-slug-organization";
import type { ApprovalWorkflowSummary } from "@/types/settings/publishing";
import { PublishingSettingsSkeleton } from "./skeleton";

export default function PublishingPageClient() {
  const organization = useSlugOrganization();
  const organizationId = organization?.id ?? "";

  const { hasScope } = useMemberPermissions(organizationId);
  const { data: workflowsData, isPending } =
    useApprovalWorkflows(organizationId);
  const { data: rolesData } = useRoles(organizationId);

  const [dialogWorkflow, setDialogWorkflow] =
    useState<ApprovalWorkflowSummary | null>(null);
  const [dialogNonce, setDialogNonce] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] =
    useState<ApprovalWorkflowSummary | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canManage = hasScope("publishing:manage");
  const roleOptions = (rolesData?.roles ?? []).map((role) => ({
    id: role.id,
    name: role.name,
  }));

  const openDialog = (workflow: ApprovalWorkflowSummary | null) => {
    setDialogWorkflow(workflow);
    setDialogNonce((nonce) => nonce + 1);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (workflow: ApprovalWorkflowSummary) => {
    setWorkflowToDelete(workflow);
    setIsDeleteOpen(true);
  };

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Publishing</h1>
            <p className="text-muted-foreground">
              Approval workflows decide who has to sign off before content can
              be published
            </p>
          </div>
          {canManage && (
            <Button onClick={() => openDialog(null)}>
              <HugeiconsIcon className="size-4" icon={Add01Icon} />
              Create workflow
            </Button>
          )}
        </div>

        {organization ? (
          <WorkflowList
            canManage={canManage}
            isLoading={isPending}
            onDelete={openDeleteDialog}
            onEdit={openDialog}
            workflows={workflowsData?.workflows ?? []}
          />
        ) : (
          <PublishingSettingsSkeleton />
        )}

        {!canManage && (
          <p className="text-muted-foreground text-xs">
            You need the publishing permission to change approval workflows.
          </p>
        )}
      </div>

      {canManage && organizationId && (
        <>
          <WorkflowDialog
            key={`${dialogWorkflow?.id ?? "create"}-${dialogNonce}`}
            onOpenChange={setIsDialogOpen}
            open={isDialogOpen}
            organizationId={organizationId}
            roles={roleOptions}
            workflow={dialogWorkflow}
          />
          <DeleteWorkflowDialog
            onOpenChange={setIsDeleteOpen}
            open={isDeleteOpen}
            organizationId={organizationId}
            workflow={workflowToDelete}
          />
        </>
      )}
    </PageContainer>
  );
}
