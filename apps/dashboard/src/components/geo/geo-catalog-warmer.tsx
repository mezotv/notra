"use client";

import { useGeoModelCatalog } from "@/lib/hooks/use-geo";

export function GeoCatalogWarmer() {
  useGeoModelCatalog();
  return null;
}
