"use client";

import { cn } from "@/lib/utils";
import type { CursorTooltipProps } from "@/types/analytics";

export function CursorTooltip({ tip }: CursorTooltipProps) {
  if (!tip) {
    return null;
  }
  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ left: tip.x, top: tip.y }}
    >
      <div
        className={cn(
          "grid min-w-32 translate-y-3 items-start gap-1 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          tip.flip ? "-translate-x-[calc(100%+0.75rem)]" : "translate-x-3"
        )}
      >
        <div className="font-medium font-mono text-foreground tabular-nums">
          {tip.title}
        </div>
        <div className="text-muted-foreground">{tip.detail}</div>
      </div>
    </div>
  );
}
