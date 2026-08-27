"use client";

import { cn } from "@notra/ui/lib/utils";
import dynamic from "next/dynamic";

import { useDitherVisibility } from "@/lib/dithering/use-dither-visibility";
import type { DeferredDitheringProps } from "@/types/dithering";

const Dithering = dynamic(
  () =>
    import("@paper-design/shaders-react").then((module_) => module_.Dithering),
  { ssr: false }
);

export function DeferredDithering({
  className,
  speed,
  ...shaderProps
}: DeferredDitheringProps) {
  const { containerRef, shouldRender, isAnimating } = useDitherVisibility();

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none", className)}
      ref={containerRef}
    >
      {shouldRender && (
        <Dithering
          {...shaderProps}
          className="h-full w-full"
          speed={isAnimating ? speed : 0}
        />
      )}
    </div>
  );
}
