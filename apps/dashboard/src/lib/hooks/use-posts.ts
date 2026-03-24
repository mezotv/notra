"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { PostsResponse } from "@/schemas/content";
import { dashboardOrpc } from "../orpc/query";

const DEFAULT_LIMIT = 12;

export function usePosts(organizationId: string) {
  return useInfiniteQuery<PostsResponse>({
    queryKey: dashboardOrpc.content.list.queryKey({
      input: { organizationId, limit: DEFAULT_LIMIT },
    }),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | null;

      return dashboardOrpc.content.list.call({
        organizationId,
        limit: DEFAULT_LIMIT,
        cursor: cursor ?? undefined,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load content" },
  });
}

export function useTodayPosts(organizationId: string) {
  return useInfiniteQuery<PostsResponse>({
    queryKey: dashboardOrpc.content.list.queryKey({
      input: { organizationId, limit: DEFAULT_LIMIT, date: "today" },
    }),
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | null;

      return dashboardOrpc.content.list.call({
        organizationId,
        limit: DEFAULT_LIMIT,
        date: "today",
        cursor: cursor ?? undefined,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load today's content" },
  });
}
