"use client";

import { SpaceXaiWordmark } from "@notra/ui/components/ui/svgs/spacexaiWordmark";
import { SpaceXaiWordmarkDark } from "@notra/ui/components/ui/svgs/spacexaiWordmarkDark";
import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";
import type { GeoProviderWordmarkProps } from "@/types/geo";

const PROVIDER_WORDMARKS: Record<
  string,
  {
    Light: ComponentType<SVGProps<SVGSVGElement>>;
    Dark: ComponentType<SVGProps<SVGSVGElement>>;
  }
> = {
  spacexai: { Light: SpaceXaiWordmark, Dark: SpaceXaiWordmarkDark },
};

export function hasProviderWordmark(provider: string): boolean {
  return provider in PROVIDER_WORDMARKS;
}

export function ProviderWordmark({
  provider,
  label,
  className,
}: GeoProviderWordmarkProps) {
  const wordmark = PROVIDER_WORDMARKS[provider];
  if (!wordmark) {
    return null;
  }
  const { Light, Dark } = wordmark;
  return (
    <span aria-label={label} className="inline-flex items-center" role="img">
      <Light className={cn(className, "block dark:hidden")} />
      <Dark className={cn(className, "hidden dark:block")} />
    </span>
  );
}
