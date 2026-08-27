"use client";

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
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/button";
import { useAgentFeedbackTokenRotate } from "@/lib/hooks/use-agent-feedback";
import type { AgentFeedbackRotateButtonProps } from "@/types/agent-feedback";

export function AgentFeedbackRotateButton({
  organizationId,
  disabled,
}: AgentFeedbackRotateButtonProps) {
  const rotate = useAgentFeedbackTokenRotate(organizationId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Button
        className="text-muted-foreground"
        disabled={disabled || rotate.isPending}
        onClick={() => setConfirmOpen(true)}
        size="sm"
        variant="ghost"
      >
        {rotate.isPending ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : null}
        Rotate
      </Button>
      <ResponsiveAlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Rotate the feedback token?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Every MCP server configured with the current token stops being
              able to submit feedback right away. Update the token after
              rotating.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                rotate.mutate();
              }}
            >
              Rotate token
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}
