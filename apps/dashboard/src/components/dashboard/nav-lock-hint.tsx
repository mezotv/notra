"use client";

import { SquareLock02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavLockHintProps } from "@/types/components/nav";

export function NavLockHint({ message, className }: NavLockHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "ml-auto inline-flex shrink-0 items-center text-muted-foreground group-data-[collapsible=icon]:hidden",
          className
        )}
        render={<span />}
      >
        <HugeiconsIcon className="size-3.5" icon={SquareLock02Icon} />
        <span className="sr-only">{message}</span>
      </TooltipTrigger>
      <TooltipContent side="right">{message}</TooltipContent>
    </Tooltip>
  );
}
