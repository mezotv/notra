"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { TooltipProvider } from "@notra/ui/components/ui/tooltip";

type DelayedTooltipProps = TooltipPrimitive.Root.Props & {
  delay?: number;
};

export function DelayedTooltip({ delay, ...props }: DelayedTooltipProps) {
  return (
    <TooltipProvider delay={delay}>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}
