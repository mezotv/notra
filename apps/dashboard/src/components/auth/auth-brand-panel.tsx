"use client";

import { useIsMobile } from "@notra/ui/hooks/use-mobile";
import { Dithering } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";

import { TestimonialCarousel } from "@/components/auth/testimonial-carousel";

export function AuthBrandPanel() {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(200deg,#a78bfa_0%,#7c3aed_55%,#5b21b6_100%)] p-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Dithering
          className="absolute top-[56.875rem] left-[calc(100%-38.75rem)] h-[49.0625rem] w-[56.625rem] origin-top-left rotate-[270deg] opacity-30"
          colorBack="#00000000"
          colorFront="#ffffff3d"
          scale={0.74}
          shape="wave"
          size={11}
          speed={shouldReduceMotion ? 0 : 0.5}
          type="4x4"
        />
      </div>
      <div className="relative">
        <TestimonialCarousel />
      </div>
    </div>
  );
}
