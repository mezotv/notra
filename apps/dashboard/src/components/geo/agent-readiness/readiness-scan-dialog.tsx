"use client";

import {
  AGENT_READINESS_SCAN_DIALOG_BODY,
  AGENT_READINESS_SCAN_DIALOG_CANCEL,
  AGENT_READINESS_SCAN_DIALOG_CONFIRM,
  AGENT_READINESS_SCAN_DIALOG_TITLE,
} from "@notra/geo-core/constants/agent-readiness";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";

import type { AgentReadinessScanDialogProps } from "@/types/agent-readiness";

export function AgentReadinessScanDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: AgentReadinessScanDialogProps) {
  return (
    <ResponsiveAlertDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>
            {AGENT_READINESS_SCAN_DIALOG_TITLE}
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {AGENT_READINESS_SCAN_DIALOG_BODY}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel disabled={isPending}>
            {AGENT_READINESS_SCAN_DIALOG_CANCEL}
          </ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction disabled={isPending} onClick={onConfirm}>
            {isPending ? "Starting…" : AGENT_READINESS_SCAN_DIALOG_CONFIRM}
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
}
