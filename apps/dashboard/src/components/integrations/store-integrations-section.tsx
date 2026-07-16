"use client";

import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { openMcpOAuthPopup } from "@notra/utils/oauth-popup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { AddMcpServerDialog } from "@/components/integrations/add-mcp-server-dialog";
import { ManageStoreIntegrationDialog } from "@/components/integrations/manage-store-integration-dialog";
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

function StoreIntegrationLogo({
  integration,
}: {
  integration: McpStoreIntegration;
}) {
  const lightLogo = integration.logoLightUrl ?? integration.logoDarkUrl;
  const darkLogo = integration.logoDarkUrl ?? integration.logoLightUrl;

  if (lightLogo && darkLogo) {
    return (
      <>
        <Image
          alt={`${integration.name} logo`}
          className="size-6 rounded object-contain dark:hidden"
          height={24}
          src={lightLogo}
          width={24}
        />
        <Image
          alt={`${integration.name} logo`}
          className="hidden size-6 rounded object-contain dark:block"
          height={24}
          src={darkLogo}
          width={24}
        />
      </>
    );
  }

  return (
    <span className="flex size-6 items-center justify-center rounded bg-muted font-medium text-muted-foreground text-xs">
      {integration.name.trim().slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}

export function StoreIntegrationsSection({
  organizationId,
}: StoreIntegrationsSectionProps) {
  const queryClient = useQueryClient();
  const [connectingIntegration, setConnectingIntegration] =
    useState<McpStoreIntegration | null>(null);
  const [managingIntegrationId, setManagingIntegrationId] = useState<
    string | null
  >(null);

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
        callbackPath: window.location.pathname,
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
        onSuccess: ({ authorizationUrl }) =>
          oauthPopup.navigate(authorizationUrl),
      });
      return;
    }

    connectPublicMutation.mutate(integration);
  };

  const integrations = data?.integrations ?? [];
  const managingIntegration = integrations.find(
    (integration) => integration.id === managingIntegrationId
  );

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
                    disabled={
                      (connectPublicMutation.isPending &&
                        connectPublicMutation.variables?.id ===
                          integration.id) ||
                      (beginOAuthMutation.isPending &&
                        beginOAuthMutation.variables?.id === integration.id)
                    }
                    onClick={() => connectIntegration(integration)}
                    size="sm"
                    variant="outline"
                  >
                    {(connectPublicMutation.isPending &&
                      connectPublicMutation.variables?.id === integration.id) ||
                    (beginOAuthMutation.isPending &&
                      beginOAuthMutation.variables?.id === integration.id)
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

      {connectingIntegration ? (
        <AddMcpServerDialog
          initialValues={{
            name: connectingIntegration.name,
            url: toMcpFormUrl(connectingIntegration.url),
            description: connectingIntegration.description ?? "",
            authType: toMcpFormAuthType(connectingIntegration.authType),
          }}
          key={connectingIntegration.id}
          logoDarkUrl={connectingIntegration.logoDarkUrl}
          logoLightUrl={connectingIntegration.logoLightUrl}
          onOpenChange={(open) => {
            if (!open) {
              setConnectingIntegration(null);
            }
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: dashboardOrpc.integrations.mcp.storeList.queryKey({
                input: { organizationId },
              }),
            });
          }}
          open
          organizationId={organizationId}
          storeIntegrationId={connectingIntegration.id}
        />
      ) : null}

      {managingIntegration?.connection ? (
        <ManageStoreIntegrationDialog
          integration={{
            ...managingIntegration,
            connection: managingIntegration.connection,
          }}
          key={managingIntegration.connection.id}
          onDisconnected={() => setManagingIntegrationId(null)}
          onOpenChange={(open) => {
            if (!open) {
              setManagingIntegrationId(null);
            }
          }}
          open
          organizationId={organizationId}
        />
      ) : null}
    </section>
  );
}
