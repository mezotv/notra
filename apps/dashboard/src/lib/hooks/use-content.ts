"use client";

import { useQuery } from "@tanstack/react-query";
import type { ContentApiResponse } from "@/types/hooks/content";
import { dashboardOrpc } from "../orpc/query";

export function useContent(organizationId: string, contentId: string) {
  return useQuery<ContentApiResponse>(
    dashboardOrpc.content.get.queryOptions({
      input: { organizationId, contentId },
      enabled: !!organizationId && !!contentId,
    })
  );
}
