"use client";

import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { openMcpOAuthPopup } from "@notra/utils/oauth-popup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { AddMcpServerDialog } from "@/components/integrations/add-mcp-server-dialog";
import { ConnectStoreIntegrationDialog } from "@/components/integrations/connect-store-integration-dialog";
import { ManageStoreIntegrationDialog } from "@/components/integrations/manage-store-integration-dialog";
import { StoreIntegrationLogo } from "@/components/integrations/store-integration-logo";
import { buildOrganizationIntegrationsPath } from "@/lib/integrations/deeplink";
import {
  MCP_ACCENT_COLOR,
  toMcpFormAuthType,
  toMcpFormUrl,
} from "@/lib/integrations/mcp";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  McpStoreIntegration,
  StoreIntegrationsSectionProps,
} from "@/types/integrations/mcp";

export function StoreIntegrationsSection({
  organizationId,
  organizationSlug,
  connectSlug,
}: StoreIntegrationsSectionProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [connectingIntegration, setConnectingIntegration] =
    useState<McpStoreIntegration | null>(null);
  const [confirmingIntegration, setConfirmingIntegration] =
    useState<McpStoreIntegration | null>(null);
  const [managingIntegrationId, setManagingIntegrationId] = useState<
    string | null
  >(null);
  const [deeplinkDismissed, setDeeplinkDismissed] = useState(false);

  const { data, isPending } = useQuery(
    dashboardOrpc.integrations.mcp.storeList.queryOptions({
      input: { organizationId },
      enabled: Boolean(organizationId),
    })
  );

  const invalidateIntegrations = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.integrations.mcp.list.queryKey({
        input: { organizationId },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.integrations.mcp.storeList.queryKey({
        input: { organizationId },
      }),
    });
  };

  const dismissDeeplink = () => {
    if (!connectSlug || deeplinkDismissed) {
      return;
    }
    setDeeplinkDismissed(true);
    router.replace(buildOrganizationIntegrationsPath(organizationSlug), {
      scroll: false,
    });
  };

  const connectPublicMutation = useMutation({
    mutationFn: async (integration: McpStoreIntegration) =>
      dashboardOrpc.integrations.mcp.create.call({
        authType: "none",
        organizationId,
        storeIntegrationId: integration.id,
        name: integration.name,
        url: integration.url,
        description: integration.description,
        headers: {},
      }),
    onSuccess: () => {
      setConfirmingIntegration(null);
      dismissDeeplink();
      invalidateIntegrations();
      toast.success("Integration connected");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const beginOAuthMutation = useMutation({
    mutationFn: async (integration: McpStoreIntegration) =>
      dashboardOrpc.integrations.mcp.beginOAuth.call({
        organizationId,
        storeIntegrationId: integration.id,
        name: integration.name,
        url: integration.url,
        description: integration.description,
        callbackPath: buildOrganizationIntegrationsPath(organizationSlug),
      }),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const connectIntegration = (integration: McpStoreIntegration) => {
    if (integration.authType === "headers") {
      setConnectingIntegration(integration);
      return;
    }

    if (integration.authType === "oauth") {
      const oauthPopup = openMcpOAuthPopup();
      beginOAuthMutation.mutate(integration, {
        onError: () => oauthPopup.close(),
        onSuccess: ({ authorizationUrl }) => {
          oauthPopup.navigate(authorizationUrl);
          setConfirmingIntegration(null);
          dismissDeeplink();
        },
      });
      return;
    }

    connectPublicMutation.mutate(integration);
  };

  const integrations = data?.integrations ?? [];

  const deeplinkIntegration =
    connectSlug && !deeplinkDismissed
      ? (integrations.find(
          (integration) =>
            integration.slug === connectSlug || integration.id === connectSlug
        ) ?? null)
      : null;

  const activeManagingIntegration =
    integrations.find(
      (integration) => integration.id === managingIntegrationId
    ) ?? (deeplinkIntegration?.connected ? deeplinkIntegration : null);

  const activeConnectingIntegration =
    connectingIntegration ??
    (!deeplinkIntegration?.connected &&
    deeplinkIntegration?.authType === "headers"
      ? deeplinkIntegration
      : null);

  const activeConfirmingIntegration =
    confirmingIntegration ??
    (deeplinkIntegration &&
    !deeplinkIntegration.connected &&
    deeplinkIntegration.authType !== "headers"
      ? deeplinkIntegration
      : null);

  const isConnectPending = (integration: McpStoreIntegration) =>
    (connectPublicMutation.isPending &&
      connectPublicMutation.variables?.id === integration.id) ||
    (beginOAuthMutation.isPending &&
      beginOAuthMutation.variables?.id === integration.id);

  if (!isPending && integrations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold text-xl tracking-tight">
          From the integration store
        </h2>
        <p className="text-muted-foreground text-sm">
          MCP servers published by the Notra community. Connect them with your
          own credentials.
        </p>
      </div>

      {isPending ? (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[0, 1, 2].map((item) => (
            <Skeleton className="h-28 w-full rounded-lg" key={item} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {integrations.map((integration) => (
            <TitleCard
              accentColor={integration.brandColor ?? MCP_ACCENT_COLOR}
              action={
                integration.connected ? (
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs" variant="default">
                      Connected
                    </Badge>
                    <span className="text-muted-foreground">
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-4"
                        icon={MoreHorizontalIcon}
                      />
                      <span className="sr-only">Manage integration</span>
                    </span>
                  </div>
                ) : (
                  <Button
                    disabled={isConnectPending(integration)}
                    onClick={() => connectIntegration(integration)}
                    size="sm"
                    variant="outline"
                  >
                    {isConnectPending(integration)
                      ? "Connecting..."
                      : "Connect"}
                  </Button>
                )
              }
              className={
                integration.connected
                  ? "h-full cursor-pointer transition-colors hover:bg-muted/80"
                  : "h-full"
              }
              heading={integration.name}
              icon={<StoreIntegrationLogo integration={integration} />}
              key={integration.id}
              onClick={() => {
                if (integration.connected) {
                  setManagingIntegrationId(integration.id);
                }
              }}
              onKeyDown={(event) => {
                if (
                  integration.connected &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  setManagingIntegrationId(integration.id);
                }
              }}
              role={integration.connected ? "button" : undefined}
              tabIndex={integration.connected ? 0 : undefined}
            >
              <p className="line-clamp-2 text-muted-foreground text-sm">
                {integration.description ??
                  (integration.author
                    ? `By ${integration.author}`
                    : "MCP server from the integration store")}
              </p>
            </TitleCard>
          ))}
        </div>
      )}

      {activeConfirmingIntegration ? (
        <ConnectStoreIntegrationDialog
          connecting={isConnectPending(activeConfirmingIntegration)}
          integration={activeConfirmingIntegration}
          key={activeConfirmingIntegration.id}
          onConnect={() => connectIntegration(activeConfirmingIntegration)}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmingIntegration(null);
              dismissDeeplink();
            }
          }}
          open
        />
      ) : null}

      {activeConnectingIntegration ? (
        <AddMcpServerDialog
          initialValues={{
            name: activeConnectingIntegration.name,
            url: toMcpFormUrl(activeConnectingIntegration.url),
            description: activeConnectingIntegration.description ?? "",
            authType: toMcpFormAuthType(activeConnectingIntegration.authType),
          }}
          key={activeConnectingIntegration.id}
          logoDarkUrl={activeConnectingIntegration.logoDarkUrl}
          logoLightUrl={activeConnectingIntegration.logoLightUrl}
          onOpenChange={(open) => {
            if (!open) {
              setConnectingIntegration(null);
              dismissDeeplink();
            }
          }}
          onSuccess={() => {
            dismissDeeplink();
            queryClient.invalidateQueries({
              queryKey: dashboardOrpc.integrations.mcp.storeList.queryKey({
                input: { organizationId },
              }),
            });
          }}
          open
          organizationId={organizationId}
          storeIntegrationId={activeConnectingIntegration.id}
        />
      ) : null}

      {activeManagingIntegration?.connection ? (
        <ManageStoreIntegrationDialog
          integration={{
            ...activeManagingIntegration,
            connection: activeManagingIntegration.connection,
          }}
          key={activeManagingIntegration.connection.id}
          onDisconnected={() => {
            setManagingIntegrationId(null);
            dismissDeeplink();
          }}
          onOpenChange={(open) => {
            if (!open) {
              setManagingIntegrationId(null);
              dismissDeeplink();
            }
          }}
          open
          organizationId={organizationId}
        />
      ) : null}
    </section>
  );
}
