"use client";

import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useGeoModelCatalog } from "@/lib/hooks/use-geo";
import type { GeoPageClientProps } from "@/types/geo";

export function GeoCatalogWarmer({ organizationSlug }: GeoPageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : getOrganization(organizationSlug);
  useGeoModelCatalog(organization?.id ?? "");
  return null;
}
