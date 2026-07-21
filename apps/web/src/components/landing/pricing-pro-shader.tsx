"use client";

import { Dithering } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";

export function PricingProShader() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Dithering
        className="absolute bottom-0 left-[-6.375rem] h-[13.8125rem] w-[34.75rem]"
        colorBack="#00000000"
        colorFront="#C8B2EE80"
        scale={1}
        shape="wave"
        size={2.9}
        speed={shouldReduceMotion ? 0 : 0.53}
        type="4x4"
      />
    </div>
  );
}
