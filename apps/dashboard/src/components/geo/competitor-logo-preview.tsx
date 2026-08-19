"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useState } from "react";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { GEO_LOGO_DEBOUNCE_MS } from "@/constants/geo";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";
import { cn } from "@/lib/utils";
import type { CompetitorLogoPreviewProps } from "@/types/geo";

export function CompetitorLogoPreview({
  name,
  website,
  className,
}: CompetitorLogoPreviewProps) {
  const [debouncedWebsite] = useDebouncedValue(website, {
    wait: GEO_LOGO_DEBOUNCE_MS,
  });
  const domain = normalizeCompetitorDomain(debouncedWebsite);
  const [settledDomain, setSettledDomain] = useState<string | null>(domain);

  const debouncing = website !== debouncedWebsite;
  const loading = debouncing || (domain !== null && settledDomain !== domain);

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <CompetitorLogo
        className={cn("size-full", loading && "opacity-0")}
        domain={domain}
        name={name}
        onSettled={() => setSettledDomain(domain)}
      />
      {loading && <Skeleton className="absolute inset-0 rounded-sm" />}
    </span>
  );
}
