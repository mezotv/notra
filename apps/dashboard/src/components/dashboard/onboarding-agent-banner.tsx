"use client";

import { Dithering } from "@paper-design/shaders-react";
import { Loader2Icon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import {
  EVE_BANNER_COLORS_DARK,
  EVE_BANNER_COLORS_LIGHT,
  EVE_BANNER_DITHER_SCALE,
  EVE_BANNER_DITHER_SHAPE,
  EVE_BANNER_DITHER_SIZE,
  EVE_BANNER_DITHER_SPEED,
  EVE_BANNER_DITHER_TYPE,
} from "@/constants/onboarding-agent";

export function OnboardingAgentBanner() {
  const { resolvedTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const colors =
    resolvedTheme === "dark" ? EVE_BANNER_COLORS_DARK : EVE_BANNER_COLORS_LIGHT;

  return (
    <div className="relative isolate flex h-(--eve-banner-height) w-full shrink-0 items-center justify-center overflow-hidden">
      <Dithering
        className="-z-10 absolute inset-0 h-full w-full"
        colorBack={colors.colorBack}
        colorFront={colors.colorFront}
        scale={EVE_BANNER_DITHER_SCALE}
        shape={EVE_BANNER_DITHER_SHAPE}
        size={EVE_BANNER_DITHER_SIZE}
        speed={shouldReduceMotion ? 0 : EVE_BANNER_DITHER_SPEED}
        type={EVE_BANNER_DITHER_TYPE}
      />
      <output className="flex items-center gap-2 text-foreground">
        <Loader2Icon
          aria-hidden
          className="size-4 animate-spin motion-reduce:animate-none"
        />
        <span className="font-medium text-sm">
          We are setting up your workspace
        </span>
      </output>
    </div>
  );
}
