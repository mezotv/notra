"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  EngagementTimeseriesResponse,
  FollowerGrowthResponse,
  LeaderboardResponse,
  LeaderboardWindow,
  NotraAdoptionResponse,
  PostingPerformanceResponse,
  SocialOverviewResponse,
  TopPostsResponse,
  TrackAccountPreviewResponse,
} from "@/types/analytics";
import { dashboardOrpc } from "../orpc/query";

const DEFAULT_TIMESERIES_DAYS = 30;
const DEFAULT_TOP_POSTS_LIMIT = 8;

export function useSocialOverview(organizationId: string) {
  return useQuery<SocialOverviewResponse>({
    ...dashboardOrpc.analytics.overview.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load analytics overview" },
  });
}

export function useEngagementTimeseries(organizationId: string, days?: number) {
  return useQuery<EngagementTimeseriesResponse>({
    ...dashboardOrpc.analytics.engagementTimeseries.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_TIMESERIES_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load engagement data" },
  });
}

export function useTopPosts(organizationId: string, limit?: number) {
  return useQuery<TopPostsResponse>({
    ...dashboardOrpc.analytics.topPosts.queryOptions({
      input: { organizationId, limit: limit ?? DEFAULT_TOP_POSTS_LIMIT },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load top posts" },
  });
}

export function useFollowerGrowth(organizationId: string, days?: number) {
  return useQuery<FollowerGrowthResponse>({
    ...dashboardOrpc.analytics.followerGrowth.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_TIMESERIES_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load follower growth" },
  });
}

const DEFAULT_PERFORMANCE_DAYS = 90;

export function usePostingPerformance(organizationId: string, days?: number) {
  return useQuery<PostingPerformanceResponse>({
    ...dashboardOrpc.analytics.postingPerformance.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_PERFORMANCE_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load posting performance" },
  });
}

export function useLeaderboard(
  organizationId: string,
  days: LeaderboardWindow
) {
  return useQuery<LeaderboardResponse>({
    ...dashboardOrpc.analytics.leaderboard.queryOptions({
      input: { organizationId, days },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load leaderboard" },
  });
}

export function useTrackAccount(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      dashboardOrpc.analytics.trackAccount.call({ organizationId, username }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.analytics.leaderboard.key(),
      });
      toast.success(`Tracking @${result.username}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to track account"
      );
    },
  });
}

export function useUntrackAccount(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trackedAccountId: string) =>
      dashboardOrpc.analytics.untrackAccount.call({
        organizationId,
        trackedAccountId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.analytics.leaderboard.key(),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to stop tracking account"
      );
    },
  });
}

export function useNotraAdoption(organizationId: string) {
  return useQuery<NotraAdoptionResponse>({
    ...dashboardOrpc.analytics.adoption.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load adoption data" },
  });
}

export function useTrackAccountPreview(organizationId: string) {
  return useMutation({
    mutationFn: (username: string): Promise<TrackAccountPreviewResponse> =>
      dashboardOrpc.analytics.previewTrackAccount.call({
        organizationId,
        username,
      }),
    onError: () => toast.error("Failed to look up account"),
  });
}
