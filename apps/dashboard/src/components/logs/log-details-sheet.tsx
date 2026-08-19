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
        <SheetHeader className="border-b bg-muted/50 pr-14">
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
                <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Integration
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <IntegrationIcon type={log.integrationType} />
                  <span className="capitalize">{log.integrationType}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
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
                <h3 className="font-medium text-sm">Error</h3>
                <p className="wrap-break-word whitespace-pre-wrap rounded-lg border bg-destructive/5 p-3 text-destructive text-sm leading-relaxed">
                  {log.errorMessage}
                </p>
              </section>
            ) : null}

            {payloadJson ? (
              <section className="space-y-2">
                <h3 className="font-medium text-sm">Payload</h3>
                <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-muted-foreground text-xs leading-relaxed">
                  {payloadJson}
                </pre>
              </section>
            ) : null}

            {log.referenceId ? (
              <section className="space-y-2">
                <h3 className="font-medium text-sm">Reference ID</h3>
                <p className="break-all font-mono text-muted-foreground text-xs">
                  {log.referenceId}
                </p>
              </section>
            ) : null}
          </div>
        ) : null}

        {log?.referenceId ? (
          <SheetFooter className="border-t bg-muted/50 sm:flex-row sm:justify-end">
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
