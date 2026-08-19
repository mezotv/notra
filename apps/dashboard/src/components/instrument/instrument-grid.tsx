import { cn } from "@/lib/utils";
import type { InstrumentGridProps } from "@/types/instrument";

export function InstrumentGrid({ children, className }: InstrumentGridProps) {
  return <div className={cn("grid gap-3", className)}>{children}</div>;
}
