"use client";

import { Dithering } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";
import type { HeroDitherProps } from "@/types/landing/hero";

export function HeroDither({ className }: HeroDitherProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Dithering
      className={className}
      colorBack="#00000000"
      colorFront="#8B5CF633"
      scale={0.53}
      shape="wave"
      size={2.9}
      speed={shouldReduceMotion ? 0 : 0.53}
      type="4x4"
    />
  );
}
