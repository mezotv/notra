"use client";

import { Cancel01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Card } from "@notra/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { type ReactNode, useId, useState } from "react";

import { Button } from "@/components/button";
import { StatusSpinner } from "@/components/geo/status-spinner";
import { GSC_OAUTH_AUTHORIZE_PATH } from "@/constants/google-search-console";
import {
  useGscCardDismissal,
  useGscClearSite,
  useGscDisconnect,
  useGscSelectSite,
  useGscStatus,
  useGscSync,
} from "@/lib/hooks/use-geo";
import { useGscConnectionToast } from "@/lib/hooks/use-gsc-connection-toast";
import { cn } from "@/lib/utils";
import type {
  SearchConsoleCardProps,
  SearchConsoleConnectActionProps,
  SearchConsoleConnectedStateProps,
  SearchConsoleHeaderRowProps,
  SearchConsoleSelectSiteStateProps,
} from "@/types/components/geo";
import type { GeoSearchConsoleStatus } from "@/types/google-search-console";
import { formatRelative } from "@/utils/format-relative";
import { formatGscSiteUrl } from "@/utils/gsc-site-url";

function buildAuthorizeUrl(organizationId: string, callbackPath: string) {
  const params = new URLSearchParams({ organizationId, callbackPath });
  return `${GSC_OAUTH_AUTHORIZE_PATH}?${params.toString()}`;
}

function HeaderRow({
  action,
  titleId,
  onDismiss,
}: SearchConsoleHeaderRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="shrink-0">
        <span className="inline-flex size-5 items-center justify-center">
          <Google className="size-4" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-medium" id={titleId}>
          Google Search Console
        </p>
        <p className="text-muted-foreground text-sm leading-snug">
          We read the queries your site ranks for and suggest the AI prompts
          people ask. Suggestions refresh weekly.
        </p>
      </div>
      {action || onDismiss ? (
        <div className="flex shrink-0 items-center gap-1">
          {action}
          {onDismiss ? (
            <Button
              aria-label="Dismiss Search Console card"
              className="text-muted-foreground"
              onClick={onDismiss}
              size="icon-sm"
              variant="ghost"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ConnectAction({
  organizationId,
  callbackPath,
  configured,
  reauth,
}: SearchConsoleConnectActionProps) {
  if (!configured) {
    return (
      <p className="text-muted-foreground max-w-40 text-xs">
        Not available on this workspace yet.
      </p>
    );
  }

  return (
    <Button
      className="shrink-0"
      nativeButton={false}
      render={
        <a href={buildAuthorizeUrl(organizationId, callbackPath)}>
          {reauth ? "Reconnect Google" : "Connect Search Console"}
        </a>
      }
      size="sm"
      variant={reauth ? "default" : "outline"}
    />
  );
}

function SelectSiteState({
  organizationId,
  callbackPath,
  status,
}: SearchConsoleSelectSiteStateProps) {
  const id = useId();
  const [siteUrl, setSiteUrl] = useState("");
  const selectSite = useGscSelectSite(organizationId);

  return (
    <ResponsiveDialog defaultOpen>
      <div className="flex flex-col items-start gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {status.lastError ??
            "Choose which Search Console property Notra should analyze."}
        </p>
        <ResponsiveDialogTrigger
          className="shrink-0"
          render={<Button size="sm" variant="outline" />}
        >
          Choose property
        </ResponsiveDialogTrigger>
      </div>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Choose a Search Console property
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Select the domain whose search queries Notra should use for prompt
            suggestions.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {status.sites.length > 0 ? (
          <div className="space-y-4 px-4 md:px-0">
            <div className="space-y-2">
              <Label htmlFor={`${id}-site`}>Property</Label>
              <Select
                onValueChange={(value) => setSiteUrl(value ?? "")}
                value={siteUrl}
              >
                <SelectTrigger className="w-full" id={`${id}-site`}>
                  <SelectValue placeholder="Select a property">
                    {(value: string | null) =>
                      value ? formatGscSiteUrl(value) : "Select a property"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {status.sites.map((site) => (
                    <SelectItem key={site.siteUrl} value={site.siteUrl}>
                      {formatGscSiteUrl(site.siteUrl)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              aria-busy={selectSite.isPending}
              className={cn(
                "w-full",
                selectSite.isPending && "disabled:opacity-100"
              )}
              disabled={siteUrl.length === 0 || selectSite.isPending}
              onClick={() => selectSite.mutate({ siteUrl })}
            >
              {selectSite.isPending ? <StatusSpinner /> : null}
              {selectSite.isPending ? "Connecting…" : "Connect property"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 px-4 md:px-0">
            <p className="text-muted-foreground text-sm">
              {status.lastError ??
                "No properties were found for this Google account. Add or verify a property in Search Console, then reconnect."}
            </p>
            <Button
              className="w-full"
              nativeButton={false}
              render={
                <a href={buildAuthorizeUrl(organizationId, callbackPath)}>
                  Reconnect Google
                </a>
              }
              variant="outline"
            />
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function connectedMeta(status: GeoSearchConsoleStatus): string {
  const parts: string[] = [];
  if (status.email) {
    parts.push(status.email);
  }
  parts.push(
    status.lastSyncedAt
      ? `Last synced ${formatRelative(status.lastSyncedAt)}`
      : "Not synced yet"
  );
  if (status.lastError) {
    parts.push(status.lastError);
  }
  return parts.join(" · ");
}

function ConnectedState({
  organizationId,
  status,
}: SearchConsoleConnectedStateProps) {
  const sync = useGscSync(organizationId);
  const clearSite = useGscClearSite(organizationId);
  const disconnect = useGscDisconnect(organizationId);
  const busy = sync.isPending || clearSite.isPending || disconnect.isPending;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm leading-snug font-medium">
            {formatGscSiteUrl(status.siteUrl ?? "")}
          </p>
          {status.weeklySyncScheduled ? (
            <Badge className="font-normal" variant="secondary">
              Weekly sync
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs leading-snug">
          {connectedMeta(status)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          disabled={busy}
          onClick={() => sync.mutate()}
          size="sm"
          variant="outline"
        >
          {sync.isPending ? <StatusSpinner /> : null}
          {sync.isPending ? "Syncing…" : "Sync now"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="Search Console actions"
                disabled={busy}
                size="icon-sm"
                variant="ghost"
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              disabled={busy}
              onClick={() => clearSite.mutate()}
            >
              Change property
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={busy}
              onClick={() => disconnect.mutate()}
              variant="destructive"
            >
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function SearchConsoleCard({
  organizationId,
  callbackPath,
}: SearchConsoleCardProps) {
  const headingId = useId();
  useGscConnectionToast();
  const { data: status, isPending } = useGscStatus(organizationId);
  const { dismiss, dismissed } = useGscCardDismissal(organizationId);

  const connectPromo = !isPending && status !== undefined && !status.connected;

  if (dismissed && (isPending || !status || connectPromo)) {
    return null;
  }

  let body: ReactNode = null;
  let headerAction: ReactNode = null;

  if (isPending || !status) {
    body = (
      <div className="text-muted-foreground flex items-center gap-2 px-4 py-3 text-sm">
        <StatusSpinner />
        Loading…
      </div>
    );
  } else if (!status.connected || status.status === "reauth_required") {
    headerAction = (
      <ConnectAction
        callbackPath={callbackPath}
        configured={status.configured}
        organizationId={organizationId}
        reauth={status.status === "reauth_required"}
      />
    );
    if (status.status === "reauth_required") {
      body = (
        <p className="text-muted-foreground px-4 py-3 text-sm">
          Google access expired. Reconnect to keep syncing keyword suggestions.
        </p>
      );
    }
  } else if (status.siteUrl) {
    body = <ConnectedState organizationId={organizationId} status={status} />;
  } else {
    body = (
      <SelectSiteState
        callbackPath={callbackPath}
        organizationId={organizationId}
        status={status}
      />
    );
  }

  return (
    <Card
      aria-busy={isPending}
      aria-labelledby={headingId}
      className="gap-0 py-0"
      role="region"
    >
      <HeaderRow
        action={headerAction}
        onDismiss={connectPromo ? dismiss : undefined}
        titleId={headingId}
      />
      {body ? (
        <>
          <div className="border-border/80 mx-4 border-t" />
          {body}
        </>
      ) : null}
    </Card>
  );
}
