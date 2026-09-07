"use client";

import type { GeoSentimentEvidenceInput } from "@notra/geo-core/types/geo-sentiment";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

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

export function useGeoSentimentEvidence(
  organizationId: string,
  enabled: boolean
) {
  const { projectId } = useGeoProjectScope();
  const range = useGeoRange();
  return useInfiniteQuery(
    dashboardOrpc.geo.sentimentEvidence.infiniteOptions({
      input: (cursor: GeoSentimentEvidenceInput["cursor"]) => ({
        organizationId,
        projectId,
        ...range.query,
        cursor,
      }),
      initialPageParam: undefined,
      getNextPageParam: (page) => page.nextCursor ?? undefined,
      enabled: !!organizationId && enabled,
    })
  );
}
