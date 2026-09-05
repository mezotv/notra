"use client";

import { useQuery } from "@tanstack/react-query";

import { GEO_SHELF_PREVIEW_STALE_MS } from "@/constants/geo-shelf";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  GeoShelfMembersResponse,
  GeoShelfPreview,
} from "@/types/geo-shelf";

export function useGeoShelfMembers(organizationId: string) {
  return useQuery<GeoShelfMembersResponse>({
    ...dashboardOrpc.geo.shelfMembers.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load team members" },
  });
}

export function useGeoShelfPreview(organizationId: string, url: string | null) {
  return useQuery<GeoShelfPreview>({
    ...dashboardOrpc.geo.shelfPreview.queryOptions({
      input: { organizationId, url: url ?? "" },
    }),
    enabled: !!organizationId && url !== null,
    staleTime: GEO_SHELF_PREVIEW_STALE_MS,
    retry: false,
  });
}
