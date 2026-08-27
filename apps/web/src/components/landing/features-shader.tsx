import { cn } from "@notra/ui/lib/utils";

import { DeferredDithering } from "@/components/deferred-dithering";
import type { FeaturesShaderProps } from "@/types/landing/features";

export function FeaturesShader({ colorFront, className }: FeaturesShaderProps) {
  return (
    <DeferredDithering
      className={cn("absolute", className)}
      colorBack="#00000000"
      colorFront={colorFront}
      scale={0.74}
      shape="wave"
      size={4}
      speed={0.5}
      type="4x4"
    />
  );
}
