"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  PostCollectionDetail,
  PostCollectionListResponse,
} from "@/schemas/content";
import { dashboardOrpc } from "../orpc/query";

const DEFAULT_PAGE_SIZE = 20;
const GENERATING_POLL_INTERVAL = 4000;

export function useCollections(organizationId: string, page: number) {
  return useQuery<PostCollectionListResponse>({
    ...dashboardOrpc.content.collections.list.queryOptions({
      input: { organizationId, page, pageSize: DEFAULT_PAGE_SIZE },
    }),
    enabled: !!organizationId,
    refetchInterval: (query) =>
      query.state.data?.collections.some(
        (collection) => collection.isGenerating
      )
        ? GENERATING_POLL_INTERVAL
        : false,
    meta: { errorMessage: "Failed to load collections" },
  });
}

export function useCollection(organizationId: string, collectionId: string) {
  return useQuery<{ collection: PostCollectionDetail }>({
    ...dashboardOrpc.content.collections.get.queryOptions({
      input: { organizationId, collectionId },
    }),
    enabled: !!organizationId && !!collectionId,
    refetchInterval: (query) =>
      query.state.data?.collection.isGenerating
        ? GENERATING_POLL_INTERVAL
        : false,
    meta: { errorMessage: "Failed to load collection" },
  });
}
