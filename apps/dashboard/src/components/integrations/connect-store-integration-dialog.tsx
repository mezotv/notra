"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@/components/button";
import { StoreIntegrationLogo } from "@/components/integrations/store-integration-logo";
import { getStoreIntegrationConnectHint } from "@/lib/integrations/mcp";
import type { ConnectStoreIntegrationDialogProps } from "@/types/integrations/mcp";

export function ConnectStoreIntegrationDialog({
  connecting,
  integration,
  onConnect,
  onOpenChange,
  open,
}: ConnectStoreIntegrationDialogProps) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border">
              <StoreIntegrationLogo integration={integration} />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 text-left">
              <ResponsiveDialogTitle className="truncate">
                Connect {integration.name}
              </ResponsiveDialogTitle>
              {integration.author ? (
                <span className="truncate text-muted-foreground text-xs">
                  By {integration.author}
                </span>
              ) : null}
            </div>
          </div>
          <ResponsiveDialogDescription className="pt-2 text-left">
            {integration.description ??
              "MCP server from the integration store."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <p className="text-muted-foreground text-sm">
          {getStoreIntegrationConnectHint(
            integration.authType,
            integration.name
          )}
        </p>
        <ResponsiveDialogFooter>
          <Button
            disabled={connecting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={connecting} onClick={onConnect}>
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
