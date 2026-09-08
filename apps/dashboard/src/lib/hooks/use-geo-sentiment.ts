"use client";

import { useQuery } from "@tanstack/react-query";

import { useGeoProjectScope } from "@/components/providers/geo-project-provider";

import { dashboardOrpc } from "../orpc/query";
import { useGeoRange } from "./use-geo-range";

export function useGeoSentiment(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const range = useGeoRange();
  return useQuery({
    ...dashboardOrpc.geo.sentiment.queryOptions({
      input: { organizationId, projectId, ...range.query },
    }),
    enabled: !!organizationId,
  });
}
