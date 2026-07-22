"use client";

import { cn } from "@notra/ui/lib/utils";
import { Dithering } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";
import type { MarketingHeroWashProps } from "~types/marketing-hero-wash";

export function MarketingHeroWash({
  children,
  className,
  innerClassName,
}: MarketingHeroWashProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative w-full overflow-clip rounded-[1.5625rem] border border-[#1E1E1E14] bg-[#C8B2EE40] dark:border-white/10 dark:bg-[#231d3a]",
        className
      )}
    >
      <Dithering
        className="-top-1/4 pointer-events-none absolute left-0 h-[150%] w-full"
        colorBack="#00000000"
        colorFront="#8B5CF62D"
        scale={0.53}
        shape="wave"
        size={2.9}
        speed={shouldReduceMotion ? 0 : 0.6}
        type="4x4"
      />
      <div className={cn("relative", innerClassName)}>{children}</div>
    </div>
  );
}
