"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/button";
import { AddMcpServerDialog } from "@/components/integrations/add-mcp-server-dialog";
import { MCP_ACCENT_COLOR, toMcpFormAuthType } from "@/lib/integrations/mcp";
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

  const { data, isPending } = useQuery(
    dashboardOrpc.integrations.mcp.storeList.queryOptions({
      input: { organizationId },
      enabled: Boolean(organizationId),
    })
  );

  const integrations = data?.integrations ?? [];

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
                  <Badge className="text-xs" variant="default">
                    Connected
                  </Badge>
                ) : (
                  <Button
                    onClick={() => setConnectingIntegration(integration)}
                    size="sm"
                    variant="outline"
                  >
                    Connect
                  </Button>
                )
              }
              className="h-full"
              heading={integration.name}
              icon={<StoreIntegrationLogo integration={integration} />}
              key={integration.id}
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
            url: connectingIntegration.url,
            description: connectingIntegration.description ?? "",
            authType: toMcpFormAuthType(connectingIntegration.authType),
          }}
          key={connectingIntegration.id}
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
        />
      ) : null}
    </section>
  );
}
