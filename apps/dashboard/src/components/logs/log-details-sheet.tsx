"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/button";
import { IntegrationIcon } from "@/components/logs/integration-icon";
import { LogStatusBadge } from "@/components/logs/log-status-badge";
import { LOG_CONTEXT_FIELDS, LOG_STATUS_DESCRIPTIONS } from "@/constants/logs";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { LogDetailsSheetProps } from "@/types/logs/details-sheet";
import { copyTextToClipboard } from "@/utils/copy-to-clipboard";
import { getLogDestination } from "@/utils/log-details";
import { formatLogTimestamp, getSourceLabel } from "@/utils/logs";

export function LogDetailsSheet({
  log,
  onOpenChange,
  open,
  organizationId,
  organizationSlug,
}: LogDetailsSheetProps) {
  const detail = useQuery({
    ...dashboardOrpc.logs.webhooks.get.queryOptions({
      input: { organizationId, logId: log?.id ?? "" },
    }),
    enabled: open && Boolean(organizationId && log?.hasPayload),
    staleTime: 60_000,
    retry: false,
  });
  const entry = detail.data ?? log;
  const destination = entry
    ? getLogDestination(entry.integrationType, organizationSlug)
    : null;
  const payload = entry?.payload;
  const contextFields = Object.entries(LOG_CONTEXT_FIELDS).flatMap(
    ([key, label]) => {
      const value = payload?.[key];
      return typeof value === "string" || typeof value === "number"
        ? [{ key, label, value: String(value) }]
        : [];
    }
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-hidden rounded-2xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:w-[calc(100%-1rem)] data-[side=right]:border data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 pr-14">
          <SheetTitle>Event details</SheetTitle>
          <SheetDescription>
            {entry
              ? formatLogTimestamp(entry.createdAt, "long")
              : "Inspect this integration event."}
          </SheetDescription>
        </SheetHeader>
        {entry ? (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <LogStatusBadge
                  status={{ label: entry.status, code: entry.statusCode }}
                />
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <IntegrationIcon type={entry.integrationType} />
                  {getSourceLabel(entry.integrationType)}
                </span>
                {entry.statusCode != null && entry.statusCode > 0 ? (
                  <span className="text-muted-foreground font-mono text-xs">
                    HTTP {entry.statusCode}
                  </span>
                ) : null}
              </div>
              <h3 className="text-lg leading-snug font-semibold wrap-break-word">
                {entry.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {LOG_STATUS_DESCRIPTIONS[entry.status]}
              </p>
            </section>
            {entry.errorMessage ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">
                  {entry.status === "failed" ? "Error details" : "Reason"}
                </h3>
                <p
                  className={`rounded-xl border p-4 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap ${entry.status === "failed" ? "border-destructive/20 bg-destructive/5" : "bg-muted/30"}`}
                >
                  {entry.errorMessage}
                </p>
              </section>
            ) : null}
            {contextFields.length > 0 ? (
              <section className="space-y-3">
                <h3 className="text-sm font-medium">Run context</h3>
                <dl className="space-y-3">
                  {contextFields.map((field) => (
                    <div
                      className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 text-sm"
                      key={field.key}
                    >
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd className="break-all">{field.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
            {log?.hasPayload && detail.isPending ? (
              <p className="text-muted-foreground text-sm" role="status">
                Loading event context…
              </p>
            ) : null}
            {detail.isError ? (
              <div className="space-y-2" role="alert">
                <p className="text-sm">{detail.error.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => detail.refetch()}
                >
                  Retry details
                </Button>
              </div>
            ) : null}
            <section className="space-y-3 border-t pt-5">
              <h3 className="text-sm font-medium">Event metadata</h3>
              <dl className="space-y-3 text-xs">
                <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                  <dt className="text-muted-foreground">Log ID</dt>
                  <dd className="font-mono break-all">{entry.id}</dd>
                </div>
                <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                  <dt className="text-muted-foreground">Timestamp</dt>
                  <dd className="font-mono break-all">{entry.createdAt}</dd>
                </div>
                {entry.integrationId ? (
                  <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                    <dt className="text-muted-foreground">Source ID</dt>
                    <dd className="font-mono break-all">
                      {entry.integrationId}
                    </dd>
                  </div>
                ) : null}
                {entry.referenceId ? (
                  <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                    <dt className="text-muted-foreground">Reference ID</dt>
                    <dd className="font-mono break-all">{entry.referenceId}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
            {payload && Object.keys(payload).length > 0 ? (
              <details className="space-y-3">
                <summary className="focus-visible:outline-ring cursor-pointer text-sm font-medium focus-visible:outline-2">
                  Raw payload
                </summary>
                <pre className="bg-muted/30 max-h-80 overflow-auto rounded-xl p-4 font-mono text-xs leading-relaxed">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}
        {entry ? (
          <SheetFooter className="flex flex-wrap gap-2 border-t px-6 py-4 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() =>
                copyTextToClipboard(
                  JSON.stringify(entry, null, 2),
                  "Event details copied"
                )
              }
            >
              <HugeiconsIcon icon={Copy01Icon} className="size-4" />
              Copy details
            </Button>
            {destination ? (
              <Button
                render={<Link href={destination.href} />}
                onClick={() => onOpenChange(false)}
              >
                {destination.label}
              </Button>
            ) : null}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
