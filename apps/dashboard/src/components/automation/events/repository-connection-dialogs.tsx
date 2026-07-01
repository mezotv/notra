import { AddRepositoryDialog } from "@/components/integrations/add-repository-dialog";
import { LegacyAddIntegrationDialog as AddIntegrationDialog } from "@/components/integrations/legacy/add-integration-dialog";
import type { RepositoryConnectionDialogsProps } from "@/types/automation/event-trigger";

export function RepositoryConnectionDialogs({
  githubIntegrationId,
  onOpenChange,
  open,
  organizationId,
}: RepositoryConnectionDialogsProps) {
  if (githubIntegrationId) {
    return (
      <AddRepositoryDialog
        integrationId={githubIntegrationId}
        onOpenChange={onOpenChange}
        open={open}
        organizationId={organizationId}
      />
    );
  }

  return (
    <AddIntegrationDialog
      onOpenChange={onOpenChange}
      open={open}
      organizationId={organizationId}
    />
  );
}
