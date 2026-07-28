"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { Button } from "@/components/button";
import type { SuggestionDetailsSheetProps } from "@/types/components/onboarding-suggestions";

export function SuggestionDetailsSheet({
  dismissing,
  onCreate,
  onDismiss,
  onOpenChange,
  open,
  suggestion,
}: SuggestionDetailsSheetProps) {
  const automationLabel =
    suggestion.type === "schedule_automation" ? "schedule" : "event automation";

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="overflow-hidden rounded-xl data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:h-auto data-[side=right]:border sm:max-w-md">
        <SheetHeader className="border-b bg-muted/50 pr-14">
          <SheetTitle>{suggestion.title}</SheetTitle>
          <SheetDescription>
            Review the recommendation before creating this {automationLabel}.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          {suggestion.description ? (
            <section className="space-y-2">
              <h3 className="font-medium text-sm">Recommendation</h3>
              <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
                {suggestion.description}
              </p>
            </section>
          ) : null}

          {suggestion.evidence ? (
            <section className="space-y-2">
              <h3 className="font-medium text-sm">Why this fits</h3>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
                  {suggestion.evidence}
                </p>
              </div>
            </section>
          ) : null}
        </div>

        <SheetFooter className="border-t bg-muted/50 sm:flex-row sm:justify-end">
          <Button disabled={dismissing} onClick={onDismiss} variant="outline">
            Dismiss
          </Button>
          <Button disabled={dismissing} onClick={onCreate}>
            Create {automationLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
