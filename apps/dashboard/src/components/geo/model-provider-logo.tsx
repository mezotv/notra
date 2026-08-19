"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ModelProviderLogoProps } from "@/types/geo";
import { modelsDevLogoUrl } from "@/utils/geo-model-display";

const LOGO_SIZE_PX = 16;

export function ModelProviderLogo({
  provider,
  className,
}: ModelProviderLogoProps) {
  return (
    <Image
      alt={`${provider} logo`}
      className={cn("size-4 shrink-0 dark:invert", className)}
      height={LOGO_SIZE_PX}
      src={modelsDevLogoUrl(provider)}
      unoptimized
      width={LOGO_SIZE_PX}
    />
  );
}
