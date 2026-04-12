"use client";

import { CreditCardIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { CreditTopupContent } from "@/components/billing/credit-topup-content";

interface CreditTopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  success?: boolean;
  onSuccess?: () => void;
}

export function CreditTopupModal({
  open,
  onOpenChange,
  success,
  onSuccess,
}: CreditTopupModalProps) {
  if (success) {
    return (
      <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <div className="-translate-x-1/2 pointer-events-none absolute top-0 left-1/2">
            <Confetti
              colors={[
                "var(--primary)",
                "#FFC700",
                "#FF6B6B",
                "#41BBC7",
                "#A78BFA",
                "#34D399",
              ]}
              duration={3000}
              force={0.5}
              particleCount={120}
              particleShape="mix"
              particleSize={8}
              stageHeight={600}
              stageWidth={800}
            />
          </div>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <HugeiconsIcon
              className="size-12 text-emerald-500"
              icon={Tick02Icon}
            />
            <div className="space-y-1">
              <h2 className="font-bold text-xl">Credits Added!</h2>
              <p className="text-muted-foreground text-sm">
                Your AI credits have been topped up and are ready to use.
              </p>
            </div>
            <Button
              className="mt-2"
              onClick={() => onOpenChange(false)}
              size="sm"
            >
              Continue
            </Button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <HugeiconsIcon className="size-5" icon={CreditCardIcon} />
            Top Up Credits
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Purchase additional AI credits for your workspace
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <CreditTopupContent
          onSuccess={onSuccess ?? (() => onOpenChange(false))}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
