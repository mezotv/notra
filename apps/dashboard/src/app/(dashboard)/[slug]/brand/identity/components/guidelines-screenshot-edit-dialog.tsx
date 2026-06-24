"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Switch } from "@notra/ui/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { SCREENSHOT_KIND_OPTIONS } from "@/constants/brand-guideline-ui";
import { useUpdateGuidelineScreenshot } from "@/lib/hooks/use-brand-guidelines";
import type { GuidelinesScreenshotEditDialogProps } from "@/types/brand-identity";

export function GuidelinesScreenshotEditDialog({
  screenshot,
  organizationId,
  voiceId,
  open,
  onOpenChange,
}: GuidelinesScreenshotEditDialogProps) {
  const update = useUpdateGuidelineScreenshot(organizationId, voiceId);
  const [kind, setKind] = useState(screenshot.kind);
  const [fullPage, setFullPage] = useState(screenshot.fullPage);

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        screenshotId: screenshot.id,
        kind,
        fullPage,
      });
      toast.success("Screenshot updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update screenshot"
      );
    }
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit screenshot</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update how this landing page capture is labeled.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              onValueChange={(next) => {
                const option = SCREENSHOT_KIND_OPTIONS.find(
                  (o) => o.value === next
                );
                if (option) {
                  setKind(option.value);
                }
              }}
              value={kind}
            >
              <SelectTrigger>
                <SelectValue>
                  {(value) =>
                    SCREENSHOT_KIND_OPTIONS.find((o) => o.value === value)
                      ?.label ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SCREENSHOT_KIND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="screenshot-full-page">Full page</Label>
            <Switch
              checked={fullPage}
              id="screenshot-full-page"
              onCheckedChange={(checked) => setFullPage(checked)}
            />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button
            disabled={update.isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={update.isPending} onClick={handleSave}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
