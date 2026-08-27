"use client";

import { cn } from "@notra/ui/lib/utils";
import Image from "next/image";
import { useMemo, useState } from "react";

import { GEO_LOGO_SIZE_PX } from "@/constants/geo";
import { projectLogoSources } from "@/lib/geo/logo";
import type { GeoProjectLogoProps } from "@/types/geo";

function ProjectLogoInner({
  name,
  domain,
  className,
  fallbackClassName,
}: GeoProjectLogoProps) {
  const sources = useMemo(
    () => projectLogoSources(domain, name.toLowerCase()),
    [domain, name]
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const activeIndex = Math.min(sourceIndex, sources.length - 1);
  const src = sources[activeIndex] ?? sources.at(-1) ?? "";
  const isFallback = activeIndex === sources.length - 1;

  return (
    <span
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-sm",
        className,
        isFallback && fallbackClassName
      )}
      data-slot="avatar"
    >
      <Image
        alt={`${name} logo`}
        className="size-full object-contain"
        height={GEO_LOGO_SIZE_PX}
        onError={() => {
          setSourceIndex((current) =>
            Math.min(current + 1, sources.length - 1)
          );
        }}
        src={src}
        unoptimized
        width={GEO_LOGO_SIZE_PX}
      />
    </span>
  );
}

export function ProjectLogo({
  name,
  domain,
  className,
  fallbackClassName,
}: GeoProjectLogoProps) {
  return (
    <ProjectLogoInner
      className={className}
      domain={domain}
      fallbackClassName={fallbackClassName}
      key={`${domain ?? ""}:${name}`}
      name={name}
    />
  );
}
