import { InstrumentSection } from "@notra/ui/components/instrument/instrument-module";
import { cn } from "@notra/ui/lib/utils";
import type { MockFrameProps } from "@/types/landing/features";

export function MockFrame({
  heading,
  subhead,
  className,
  children,
}: MockFrameProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none select-none rounded-2xl border border-border bg-background p-4 text-left shadow-[0_0.125rem_1.4375rem_#0000001A,0_0.0625rem_0.125rem_#0000000A] dark:shadow-none",
        className
      )}
    >
      <InstrumentSection description={subhead} eyebrow={heading}>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {children}
        </div>
      </InstrumentSection>
    </div>
  );
}
