"use client";

import { cn } from "@notra/ui/lib/utils";
import { Dithering } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";
import type { FeaturesShaderProps } from "@/types/landing/features";

export function FeaturesShader({ colorFront, className }: FeaturesShaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Dithering
      className={cn("pointer-events-none absolute", className)}
      colorBack="#00000000"
      colorFront={colorFront}
      scale={0.74}
      shape="wave"
      size={4}
      speed={shouldReduceMotion ? 0 : 0.5}
      type="4x4"
    />
  );
}
