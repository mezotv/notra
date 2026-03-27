"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteIntegrationDialog } from "@/components/delete-integration-dialog";
import { EmptyState } from "@/components/empty-state";
import { AddLinearIntegrationDialog } from "@/components/integrations/add-linear-integration-dialog";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useLinearConnectionToast } from "@/lib/hooks/use-linear-connection-toast";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { LinearIntegration } from "@/types/integrations";
import { LinearIntegrationsPageSkeleton } from "./skeleton";

interface PageClientProps {
  organizationSlug: string;
}

function LinearIntegrationCard({
  integration,
  organizationId,
  organizationSlug,
  onUpdate,
}: {
  integration: LinearIntegration;
  organizationId: string;
  organizationSlug: string;
  onUpdate?: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return dashboardOrpc.integrations.linear.update.call({
        organizationId,
        integrationId: integration.id,
        enabled,
      });
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.linear.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success(enabled ? "Integration enabled" : "Integration disabled");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to update integration");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return dashboardOrpc.integrations.linear.delete.call({
        organizationId,
        integrationId: integration.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.linear.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("Integration deleted");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to delete integration");
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate(!integration.enabled);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  const isLoading = toggleMutation.isPending || deleteMutation.isPending;

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-no-card-click]")) {
      return;
    }
    const destination = `/${organizationSlug}/integrations/linear/${integration.id}`;
    router.prefetch(destination);
    router.push(destination);
  };

  return (
    <>
      <Card
        className="cursor-pointer transition-colors hover:bg-accent/50"
        onClick={handleCardClick}
      >
        <CardHeader>
          <CardTitle>{integration.displayName}</CardTitle>
          <CardDescription>
            {integration.createdByUser ? (
              <>
                Added by {integration.createdByUser.name} on{" "}
                {new Date(integration.createdAt).toLocaleDateString()}
              </>
            ) : (
              <>
                Created on{" "}
                {new Date(integration.createdAt).toLocaleDateString()}
              </>
            )}
          </CardDescription>
          <CardAction>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Event propagation barrier */}
            <div
              className="flex items-center gap-2"
              data-no-card-click
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              role="presentation"
              tabIndex={-1}
            >
              <Badge variant={integration.enabled ? "default" : "secondary"}>
                {integration.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button disabled={isLoading} size="icon-sm" variant="ghost">
                      <svg
                        aria-label="More options"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>More options</title>
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggle();
                    }}
                  >
                    {integration.enabled ? "Disable" : "Enable"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                    variant="destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            {integration.linearOrganizationName ? (
              <p>
                {integration.linearOrganizationName}
                {integration.linearTeamName
                  ? ` / ${integration.linearTeamName}`
                  : ""}
              </p>
            ) : (
              <p>Linear workspace connected</p>
            )}
          </div>
        </CardContent>
      </Card>
      <DeleteIntegrationDialog
        affectedSchedules={[]}
        integrationName={integration.displayName}
        isDeleting={deleteMutation.isPending}
        isLoadingSchedules={false}
        onConfirm={handleDelete}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      />
    </>
  );
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization } = useOrganizationsContext();
  const organization = getOrganization(organizationSlug);
  const pathname = usePathname();

  useLinearConnectionToast();

  const {
    data: response,
    isLoading: isLoadingIntegrations,
    refetch,
  } = useQuery(
    dashboardOrpc.integrations.linear.list.queryOptions({
      input: { organizationId: organization?.id ?? "" },
      enabled: !!organization?.id,
    })
  );

  const integrations = response?.integrations;
  const showLoading = !!organization?.id && isLoadingIntegrations && !response;

  const authorizeUrl = `/api/integrations/linear/authorize?organizationId=${organization?.id ?? ""}&callbackPath=${encodeURIComponent(pathname)}`;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">
              Linear Integrations
            </h1>
            <p className="text-muted-foreground">
              Manage your Linear integrations for automated content
            </p>
          </div>
          <AddLinearIntegrationDialog
            authorizeUrl={authorizeUrl}
            trigger={
              <Button size="sm" variant="default">
                Connect Linear
              </Button>
            }
          />
        </div>

        <div>
          {showLoading ? <LinearIntegrationsPageSkeleton /> : null}

          {!showLoading && (!integrations || integrations.length === 0) ? (
            <EmptyState
              action={
                <AddLinearIntegrationDialog
                  authorizeUrl={authorizeUrl}
                  trigger={
                    <Button size="sm" variant="outline">
                      Connect Linear
                    </Button>
                  }
                />
              }
              description="Connect Linear to start syncing issues and updates."
              title="No integrations yet"
            />
          ) : null}

          {!showLoading && integrations && integrations.length > 0 ? (
            <div className="grid gap-4">
              {integrations.map((integration) => (
                <LinearIntegrationCard
                  integration={integration}
                  key={integration.id}
                  onUpdate={() => refetch()}
                  organizationId={organization?.id ?? ""}
                  organizationSlug={organizationSlug}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
