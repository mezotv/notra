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
  SelectValue,
} from "@notra/ui/components/ui/select";

import {
  AgentFeedbackKindBadge,
  AgentFeedbackStatusBadge,
} from "@/components/agent-feedback/feedback-badges";
import { Button } from "@/components/button";
import {
  AGENT_FEEDBACK_SENTIMENT_LABELS,
  AGENT_FEEDBACK_STATUS_LABELS,
  AGENT_FEEDBACK_UNSPECIFIED_LABEL,
} from "@/constants/agent-feedback";
import type {
  AgentFeedbackDetailDialogProps,
  AgentFeedbackDetailFieldProps,
} from "@/types/agent-feedback";
import { isAgentFeedbackStatus } from "@/utils/agent-feedback";
import { formatRelative } from "@/utils/format-relative";

function DetailField({
  label,
  value,
  mono = false,
}: AgentFeedbackDetailFieldProps) {
  if (!value) {
    return null;
  }
  return (
    <div className="space-y-1.5">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {label}
      </h3>
      <p className={mono ? "font-mono text-xs break-all" : "text-sm"}>
        {value}
      </p>
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
            {item
              ? `Received ${formatRelative(item.createdAt)}${item.agentClient ? ` via ${item.agentClient}` : ""}`
              : "Inspect this feedback."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {item ? (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            <section className="flex flex-wrap items-center gap-2">
              <AgentFeedbackKindBadge kind={item.kind} />
              <AgentFeedbackStatusBadge status={item.status} />
              {item.sentiment ? (
                <span className="text-muted-foreground text-xs">
                  {AGENT_FEEDBACK_SENTIMENT_LABELS[item.sentiment]}
                </span>
              ) : null}
            </section>

            <section className="space-y-1.5">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Message
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {item.message}
              </p>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <DetailField
                label="Agent"
                value={item.agentClient ?? AGENT_FEEDBACK_UNSPECIFIED_LABEL}
              />
              <DetailField label="Model" value={item.agentModel} />
              <DetailField label="Tool version" value={item.toolVersion} />
              <DetailField label="Source" value={item.source} />
              <DetailField label="External ID" mono value={item.externalId} />
              <DetailField label="Project" mono value={item.projectId} />
            </section>

            <DetailField label="Context URL" mono value={item.contextUrl} />
            <DetailField label="User agent" mono value={item.userAgent} />

            {metadataJson ? (
              <section className="space-y-1.5">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Metadata
                </h3>
                <pre className="bg-muted/40 max-h-64 overflow-auto rounded-md border p-3 font-mono text-xs">
                  {metadataJson}
                </pre>
              </section>
            ) : null}
          </div>
        ) : null}
        <ResponsiveDialogFooter className="bg-muted/50 mx-0 mb-0 shrink-0 flex-row items-center justify-between gap-3 rounded-b-xl border-t p-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs tracking-wider uppercase">
              Status
            </span>
            <Select
              disabled={isUpdating || !item}
              onValueChange={(value) => {
                if (value && isAgentFeedbackStatus(value)) {
                  onStatusChange(value);
                }
              }}
              value={item?.status ?? "new"}
            >
              <SelectTrigger className="bg-background w-40">
                <SelectValue className="capitalize" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_FEEDBACK_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {AGENT_FEEDBACK_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ResponsiveDialogClose render={<Button variant="outline" />}>
            Done
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
