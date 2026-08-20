"use client";

import { Cancel01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-0.5 shrink-0">
        <span className="inline-flex size-5 items-center justify-center">
          <Google className="size-4" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm leading-snug" id={titleId}>
          Google Search Console
        </p>
        <p className="text-muted-foreground text-sm leading-snug">
          We read the queries your site ranks for and suggest the AI prompts
          people ask about the same topics. Suggestions refresh every week.
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
      {onDismiss ? (
        <Button
          aria-label="Dismiss Search Console card"
          className="shrink-0 text-muted-foreground"
          onClick={onDismiss}
          size="icon-sm"
          variant="ghost"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
        </Button>
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
      <p className="max-w-40 text-muted-foreground text-xs">
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
  status,
}: SearchConsoleSelectSiteStateProps) {
  const id = useId();
  const [siteUrl, setSiteUrl] = useState("");
  const selectSite = useGscSelectSite(organizationId);

  if (status.sites.length === 0) {
    return (
      <p className="px-4 py-3 text-muted-foreground text-sm">
        {status.lastError ??
          "No Search Console properties found for this Google account. Add a property in Search Console, then reconnect."}
      </p>
    );
  }

  return (
    <div className="space-y-2 px-4 py-3">
      <Label htmlFor={`${id}-site`}>Choose the property to analyze</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          onValueChange={(value) => setSiteUrl(value ?? "")}
          value={siteUrl}
        >
          <SelectTrigger className="w-full sm:max-w-md" id={`${id}-site`}>
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
        <Button
          aria-busy={selectSite.isPending}
          className={cn(
            "shrink-0",
            selectSite.isPending && "disabled:opacity-100"
          )}
          disabled={siteUrl.length === 0 || selectSite.isPending}
          onClick={() => selectSite.mutate({ siteUrl })}
          size="sm"
        >
          {selectSite.isPending ? <StatusSpinner /> : null}
          {selectSite.isPending ? "Checking…" : "Use property"}
        </Button>
      </div>
    </div>
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
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-sm leading-snug">
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
      <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground text-sm">
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
        <p className="px-4 py-3 text-muted-foreground text-sm">
          Google access expired. Reconnect to keep syncing keyword suggestions.
        </p>
      );
    }
  } else if (status.siteUrl) {
    body = <ConnectedState organizationId={organizationId} status={status} />;
  } else {
    body = <SelectSiteState organizationId={organizationId} status={status} />;
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
          <div className="mx-4 border-border/80 border-t" />
          {body}
        </>
      ) : null}
    </Card>
  );
}
