"use client";

import { Shimmer } from "@notra/ui/components/ai-elements/shimmer";
import { cn } from "@notra/ui/lib/utils";

export function ChatgptThinking({
  className,
  reducedMotion = false,
}: {
  className?: string;
  reducedMotion?: boolean;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in text-[15px] leading-7 text-muted-foreground duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-none",
        className
      )}
    >
      {reducedMotion ? (
        "Thinking"
      ) : (
        <Shimmer className="font-medium" duration={1.6} spread={1.4}>
          Thinking
        </Shimmer>
      )}
    </div>
  );
}
