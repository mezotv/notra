"use client";

import { cn } from "@notra/ui/lib/utils";
import Image from "next/image";
import { useMemo, useState } from "react";
import { GEO_LOGO_SIZE_PX } from "@/constants/geo";
import { buildCompetitorLogoUrl } from "@/lib/geo/logo";
import type { CompetitorLogoProps } from "@/types/geo";

export function CompetitorLogo({
  name,
  domain,
  className,
}: CompetitorLogoProps) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(
    () => (domain ? buildCompetitorLogoUrl(domain) : null),
    [domain]
  );

  const shellClassName = cn(
    "inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm",
    className
  );

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={cn(shellClassName, "bg-muted text-[0.625rem] leading-none")}
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <span className={cn(shellClassName, "bg-muted")}>
      <Image
        alt={`${name} logo`}
        className="size-full object-contain"
        height={GEO_LOGO_SIZE_PX}
        onError={() => setFailed(true)}
        src={src}
        unoptimized
        width={GEO_LOGO_SIZE_PX}
      />
    </span>
  );
}
