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
import { toast } from "sonner";

import { Button } from "@/components/button";
import { IntegrationIcon } from "@/components/logs/integration-icon";
import { LogStatusBadge } from "@/components/logs/log-status-badge";
import type { LogDetailsSheetProps } from "@/types/logs/details-sheet";
import type { Log, StatusWithCode } from "@/types/webhooks/webhooks";
import { formatLogTimestamp } from "@/utils/logs";

function toStatus(log: Log): StatusWithCode {
  if (log.status === "success" || log.status === "failed") {
    return { label: log.status, code: log.statusCode ?? 0 };
  }

  return { label: log.status, code: log.statusCode };
}

export function LogDetailsSheet({
  log,
  onOpenChange,
  open,
}: LogDetailsSheetProps) {
  const payloadJson =
    log?.payload && Object.keys(log.payload).length > 0
      ? JSON.stringify(log.payload, null, 2)
      : null;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="overflow-hidden rounded-xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:border sm:max-w-md">
        <SheetHeader className="bg-muted/50 border-b pr-14">
          <SheetTitle className="wrap-break-word">
            {log?.title ?? "Log details"}
          </SheetTitle>
          <SheetDescription>
            {log
              ? formatLogTimestamp(log.createdAt, "long")
              : "Inspect this integration event."}
          </SheetDescription>
        </SheetHeader>

        {log ? (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            <section className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Integration
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <IntegrationIcon type={log.integrationType} />
                  <span className="capitalize">{log.integrationType}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Status
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <LogStatusBadge status={toStatus(log)} />
                  {log.statusCode !== null ? (
                    <span className="text-muted-foreground text-xs">
                      {log.statusCode}
                    </span>
                  ) : null}
                </div>
              </div>
            </section>

            {log.errorMessage ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Error</h3>
                <p className="bg-destructive/5 text-destructive rounded-lg border p-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                  {log.errorMessage}
                </p>
              </section>
            ) : null}

            {payloadJson ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Payload</h3>
                <pre className="bg-muted/50 text-muted-foreground max-h-64 overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed">
                  {payloadJson}
                </pre>
              </section>
            ) : null}

            {log.referenceId ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Reference ID</h3>
                <p className="text-muted-foreground font-mono text-xs break-all">
                  {log.referenceId}
                </p>
              </section>
            ) : null}
          </div>
        ) : null}

        {log?.referenceId ? (
          <SheetFooter className="bg-muted/50 border-t sm:flex-row sm:justify-end">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(log.referenceId ?? "");
                toast.success("Reference ID copied");
              }}
              variant="outline"
            >
              <HugeiconsIcon className="size-4" icon={Copy01Icon} />
              Copy reference ID
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
