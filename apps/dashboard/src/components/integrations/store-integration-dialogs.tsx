"use client";

import { AddMcpServerDialog } from "@/components/integrations/add-mcp-server-dialog";
import { ConnectStoreIntegrationDialog } from "@/components/integrations/connect-store-integration-dialog";
import { ManageStoreIntegrationDialog } from "@/components/integrations/manage-store-integration-dialog";
import { toMcpFormAuthType, toMcpFormUrl } from "@/lib/integrations/mcp";
import type { StoreIntegrationDialogsProps } from "@/types/integrations/mcp";

export function StoreIntegrationDialogs({
  organizationId,
  confirmingIntegration,
  confirmingPending,
  connectingIntegration,
  managingIntegration,
  onConfirmConnect,
  onConfirmingClose,
  onConnectingClose,
  onConnectingSuccess,
  onManagingClose,
}: StoreIntegrationDialogsProps) {
  return (
    <>
      {confirmingIntegration ? (
        <ConnectStoreIntegrationDialog
          connecting={confirmingPending}
          integration={confirmingIntegration}
          key={confirmingIntegration.id}
          onConnect={onConfirmConnect}
          onOpenChange={(open) => {
            if (!open) {
              onConfirmingClose();
            }
          }}
          open
        />
      ) : null}

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
              onConnectingClose();
            }
          }}
          onSuccess={onConnectingSuccess}
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
          onDisconnected={onManagingClose}
          onOpenChange={(open) => {
            if (!open) {
              onManagingClose();
            }
          }}
          open
          organizationId={organizationId}
        />
      ) : null}
    </>
  );
}
