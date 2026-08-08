"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { TooltipProvider } from "@notra/ui/components/ui/tooltip";
import type { DelayedTooltipProps } from "@/types/components/delayed-tooltip";

export function DelayedTooltip({ delay, ...props }: DelayedTooltipProps) {
  return (
    <TooltipProvider delay={delay}>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}
