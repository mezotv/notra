import { cn } from "@/lib/utils";
import type { InstrumentGridProps } from "@/types/instrument";

export function InstrumentGrid({ children, className }: InstrumentGridProps) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-md border border-border bg-border",
        className
      )}
    >
      {children}
    </div>
  );
}
