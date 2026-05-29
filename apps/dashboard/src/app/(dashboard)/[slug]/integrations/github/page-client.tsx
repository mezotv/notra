"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { AddIntegrationDialog } from "@/components/integrations/add-integration-dialog";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { dashboardOrpc } from "@/lib/orpc/query";
import { GitHubIntegrationsPageSkeleton } from "./skeleton";

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization } = useOrganizationsContext();
  const organization = getOrganization(organizationSlug);
  const organizationId = organization?.id ?? "";
  const [dialogOpen, setDialogOpen] = useState(false);

  useHotkey("C", () => setDialogOpen(true), { enabled: !dialogOpen });

  const {
    data: response,
    isLoading: isLoadingIntegrations,
    refetch,
  } = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );

  const integrations = response?.integrations.filter(
    (i) => i.type === "github"
  );
  const showLoading = !!organizationId && isLoadingIntegrations && !response;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">
              GitHub Integrations
            </h1>
            <p className="text-muted-foreground">
              Manage your GitHub repository integrations and outputs
            </p>
          </div>
          <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Connect GitHub
            <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
          </Button>
        </div>

        <div>
          {showLoading ? <GitHubIntegrationsPageSkeleton /> : null}

          {!showLoading && (!integrations || integrations.length === 0) ? (
            <EmptyState
              action={
                <Button
                  onClick={() => setDialogOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  Connect GitHub
                </Button>
              }
              description="Add your first GitHub integration to get started."
              title="No integrations yet"
            />
          ) : null}

          {!showLoading && integrations && integrations.length > 0 ? (
            <div className="grid gap-4">
              {integrations.map((integration) => (
                <IntegrationCard
                  integration={integration}
                  key={integration.id}
                  onUpdate={() => refetch()}
                  organizationId={organizationId}
                  organizationSlug={organizationSlug}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <AddIntegrationDialog
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
        open={dialogOpen}
        organizationId={organizationId}
        organizationSlug={organizationSlug}
      />
    </PageContainer>
  );
}
