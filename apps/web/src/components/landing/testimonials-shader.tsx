"use client";

import { Dithering } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";
import type { TestimonialsShaderProps } from "@/types/landing/testimonials";

export function TestimonialsShader({
  size,
  colorFront,
  className,
}: TestimonialsShaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Dithering
      className={className}
      colorBack="#00000000"
      colorFront={colorFront}
      scale={0.74}
      shape="wave"
      size={size}
      speed={shouldReduceMotion ? 0 : 0.5}
      type="4x4"
    />
  );
}
