"use client";

import { useQuery } from "@tanstack/react-query";
import type { PostsResponse } from "@/schemas/content";
import { dashboardOrpc } from "../orpc/query";

const DEFAULT_PAGE_SIZE = 12;

export function usePosts(organizationId: string, page: number) {
  return useQuery<PostsResponse>({
    ...dashboardOrpc.content.list.queryOptions({
      input: { organizationId, page, pageSize: DEFAULT_PAGE_SIZE },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load content" },
  });
}

export function useTodayPosts(organizationId: string) {
  return useQuery<PostsResponse>({
    ...dashboardOrpc.content.list.queryOptions({
      input: {
        organizationId,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        date: "today",
      },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load today's content" },
  });
}
