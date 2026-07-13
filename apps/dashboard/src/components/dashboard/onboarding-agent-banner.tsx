"use client";

import { Dithering } from "@paper-design/shaders-react";
import { Loader2Icon } from "lucide-react";
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
import type { OnboardingAgentBannerProps } from "@/types/components/onboarding-agent-banner";

export function OnboardingAgentBanner({ debug }: OnboardingAgentBannerProps) {
  const { resolvedTheme } = useTheme();
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
        speed={EVE_BANNER_DITHER_SPEED}
        type={EVE_BANNER_DITHER_TYPE}
      />
      <div className="flex items-center gap-2 text-foreground">
        <Loader2Icon aria-hidden className="size-4 animate-spin" />
        <span className="font-medium text-sm">
          We are setting up your workspace
        </span>
        {debug ? (
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-medium text-[0.625rem] uppercase tracking-wide">
            debug
          </span>
        ) : null}
      </div>
    </div>
  );
}
