"use client";

import { AGENT_FEEDBACK_STATUSES } from "@notra/db/constants/agent-feedback";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@notra/ui/components/ui/select";
import { cn } from "@notra/ui/lib/utils";

import { AgentFeedbackAgent } from "@/components/agent-feedback/feedback-agent-icon";
import {
  AgentFeedbackKindBadge,
  AgentFeedbackSentimentLabel,
  AgentFeedbackStatusBadge,
} from "@/components/agent-feedback/feedback-badges";
import { Button } from "@/components/button";
import type {
  AgentFeedbackDetailDialogProps,
  AgentFeedbackDetailFieldProps,
} from "@/types/agent-feedback";
import { isAgentFeedbackStatus } from "@/utils/agent-feedback";
import { formatRelative } from "@/utils/format-relative";

function DetailField({
  label,
  value,
  children,
  mono = false,
}: AgentFeedbackDetailFieldProps) {
  if (!children && !value) {
    return null;
  }
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3 py-1.5">
      <div className="text-muted-foreground pt-0.5 text-xs">{label}</div>
      {children ?? (
        <p className={cn(mono ? "font-mono text-xs break-all" : "text-sm")}>
          {value}
        </p>
      )}
    </div>
  );
}

export function AgentFeedbackDetailDialog({
  item,
  open,
  onOpenChange,
  onStatusChange,
  isUpdating,
}: AgentFeedbackDetailDialogProps) {
  const metadataJson =
    item?.metadata && Object.keys(item.metadata).length > 0
      ? JSON.stringify(item.metadata, null, 2)
      : null;

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="flex max-h-[85svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[36rem]">
        <ResponsiveDialogHeader className="shrink-0 border-b p-4 pr-14">
          <ResponsiveDialogTitle className="wrap-break-word">
            {item?.title ?? "Feedback"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {item ? (
              <span className="inline-flex flex-wrap items-center gap-x-1.5">
                Received {formatRelative(item.createdAt)}
                {item.agentClient ? (
                  <>
                    <span aria-hidden="true">via</span>
                    <AgentFeedbackAgent
                      className="text-muted-foreground"
                      client={item.agentClient}
                    />
                  </>
                ) : null}
              </span>
            ) : (
              "Inspect this feedback."
            )}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {item ? (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            <section className="space-y-2">
              <div className="text-muted-foreground text-xs">Labels</div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <AgentFeedbackKindBadge kind={item.kind} />
                  <AgentFeedbackSentimentLabel sentiment={item.sentiment} />
                </div>
                <Select
                  disabled={isUpdating}
                  onValueChange={(value) => {
                    if (value && isAgentFeedbackStatus(value)) {
                      onStatusChange(value);
                    }
                  }}
                  value={item.status}
                >
                  <SelectTrigger
                    aria-label="Feedback status"
                    className="hover:bg-background bg-background h-8 w-auto shrink-0 gap-1.5"
                  >
                    <AgentFeedbackStatusBadge status={item.status} />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {AGENT_FEEDBACK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        <AgentFeedbackStatusBadge status={status} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-1.5">
              <div className="text-muted-foreground text-xs">Message</div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {item.message}
              </p>
            </section>

            <section className="divide-y">
              <DetailField label="Agent">
                <AgentFeedbackAgent
                  className="text-sm"
                  client={item.agentClient}
                />
              </DetailField>
              <DetailField label="Model" value={item.agentModel} />
              <DetailField label="Tool version" value={item.toolVersion} />
              <DetailField label="Source" value={item.source} />
              <DetailField label="External ID" mono value={item.externalId} />
              <DetailField label="Project" mono value={item.projectId} />
              <DetailField label="Context URL" mono value={item.contextUrl} />
              <DetailField label="User agent" mono value={item.userAgent} />
            </section>

            {metadataJson ? (
              <section className="space-y-1.5">
                <div className="text-muted-foreground text-xs">Metadata</div>
                <pre className="bg-muted/40 max-h-64 overflow-auto rounded-md border p-3 font-mono text-xs">
                  {metadataJson}
                </pre>
              </section>
            ) : null}
          </div>
        ) : null}
        <ResponsiveDialogFooter className="bg-muted/50 mx-0 mb-0 shrink-0 flex-row items-center justify-end gap-3 rounded-b-xl border-t p-4">
          <ResponsiveDialogClose render={<Button variant="outline" />}>
            Done
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
