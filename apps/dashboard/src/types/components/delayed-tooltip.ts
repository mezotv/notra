import type { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

export type DelayedTooltipProps = TooltipPrimitive.Root.Props & {
  delay?: number;
};
