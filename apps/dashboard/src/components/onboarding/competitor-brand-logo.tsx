"use client";

import { GEO_LOGO_SIZE_PX } from "@notra/geo-core/constants/geo";
import { cn } from "@notra/ui/lib/utils";
import Image from "next/image";
import { useState } from "react";

import { CompetitorLogo } from "@/components/geo/competitor-logo";
import type { CompetitorBrandLogoProps } from "@/types/onboarding";

export function CompetitorBrandLogo({
  name,
  domain,
  logo,
  className,
}: CompetitorBrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!logo || failed) {
    return <CompetitorLogo className={className} domain={domain} name={name} />;
  }

  return (
    <span
      className={cn(
        "bg-muted inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm",
        className
      )}
    >
      <Image
        alt={`${name} logo`}
        className="size-full object-contain"
        height={GEO_LOGO_SIZE_PX}
        onError={() => setFailed(true)}
        src={logo}
        unoptimized
        width={GEO_LOGO_SIZE_PX}
      />
    </span>
  );
}
