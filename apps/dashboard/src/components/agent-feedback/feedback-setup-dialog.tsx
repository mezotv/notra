"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { useState } from "react";
import { AgentFeedbackSetup } from "@/components/agent-feedback/feedback-setup";
import { Button } from "@/components/button";
import { useAgentFeedbackSetup } from "@/lib/hooks/use-agent-feedback";
import type { AgentFeedbackSetupDialogProps } from "@/types/agent-feedback";

export function AgentFeedbackSetupDialog({
  organizationId,
}: AgentFeedbackSetupDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: setup } = useAgentFeedbackSetup(organizationId);

  return (
    <>
      <Button
        className="w-fit gap-1.5"
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
      >
        <HugeiconsIcon className="size-4" icon={Settings01Icon} />
        Setup
      </Button>
      <ResponsiveDialog onOpenChange={setOpen} open={open}>
        <ResponsiveDialogContent className="flex max-h-[85svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[40rem]">
          <ResponsiveDialogHeader className="shrink-0 border-b p-4 pr-14">
            <ResponsiveDialogTitle>Feedback setup</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Add the feedback tool to another MCP server or update the token
              you ship with it.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <AgentFeedbackSetup organizationId={organizationId} setup={setup} />
          </div>
          <ResponsiveDialogFooter className="mx-0 mb-0 shrink-0 rounded-b-xl border-t bg-muted/50 p-4">
            <ResponsiveDialogClose render={<Button variant="outline" />}>
              Done
            </ResponsiveDialogClose>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
