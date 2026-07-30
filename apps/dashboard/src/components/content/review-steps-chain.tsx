"use client";

import { CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import type { ReviewStepsChainProps } from "@/types/reviews";

export function ReviewStepsChain({ steps }: ReviewStepsChainProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {steps.map((step) => (
        <li
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-border/80 px-2 py-1 text-xs",
            step.isCurrent &&
              "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
            step.isComplete &&
              !step.isCurrent &&
              "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            !(step.isCurrent || step.isComplete) && "text-muted-foreground"
          )}
          key={step.stepOrder}
        >
          <HugeiconsIcon
            className="size-3.5"
            icon={step.isComplete ? CheckmarkCircle02Icon : Clock01Icon}
          />
          <span className="font-medium">
            {step.name ?? step.reviewerAccessGroupName}
          </span>
          <span className="opacity-70">
            {step.name ? `${step.reviewerAccessGroupName} · ` : ""}
            {step.approvals}/{step.requiredApprovals}
          </span>
        </li>
      ))}
    </ol>
  );
}
