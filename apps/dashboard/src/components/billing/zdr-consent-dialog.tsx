"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";

import { Button } from "@/components/button";
import {
  ZDR_CONSENT_BODY,
  ZDR_CONSENT_CANCEL,
  ZDR_CONSENT_CONFIRM,
  ZDR_CONSENT_FOOTNOTE,
  ZDR_CONSENT_POINTS,
  ZDR_CONSENT_TITLE,
} from "@/constants/billing";
import type { ZdrConsentDialogProps } from "@/types/billing/plan";

export function ZdrConsentDialog({
  open,
  onOpenChange,
  onConfirm,
}: ZdrConsentDialogProps) {
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{ZDR_CONSENT_TITLE}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {ZDR_CONSENT_BODY}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
          {ZDR_CONSENT_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">{ZDR_CONSENT_FOOTNOTE}</p>
        <ResponsiveDialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {ZDR_CONSENT_CANCEL}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {ZDR_CONSENT_CONFIRM}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
