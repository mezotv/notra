"use client";

import { Linkedin02Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import type { ProviderIconProps } from "@/types/analytics";

export function ProviderIcon({ provider, className }: ProviderIconProps) {
  if (provider === "twitter") {
    return (
      <HugeiconsIcon
        className={cn("size-4 shrink-0", className)}
        icon={NewTwitterIcon}
      />
    );
  }
  if (provider === "linkedin") {
    return (
      <HugeiconsIcon
        className={cn("size-4 shrink-0 text-[#0a66c2]", className)}
        icon={Linkedin02Icon}
      />
    );
  }
  return null;
}
