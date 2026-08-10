import {
  loadEngagementTimeseries,
  loadFollowerGrowth,
  loadLeaderboard,
  loadNotraAdoption,
  loadPostingPerformance,
  loadSocialOverview,
  loadTopPosts,
  previewTrackedAccount,
  trackTwitterAccount,
  untrackTwitterAccount,
} from "@/lib/analytics/programs";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import { runOrpcEffect } from "@/lib/orpc/effect";
import { toAnalyticsOrpcError } from "@/lib/orpc/utils/analytics-errors";
import {
  analyticsOrganizationInputSchema,
  analyticsPostingPerformanceInputSchema,
  analyticsTimeseriesInputSchema,
  analyticsTopPostsInputSchema,
  leaderboardInputSchema,
  trackAccountInputSchema,
  untrackAccountInputSchema,
} from "@/schemas/analytics";
import type {
  EngagementTimeseriesResponse,
  FollowerGrowthResponse,
  LeaderboardResponse,
  NotraAdoptionResponse,
  PostingPerformanceResponse,
  SocialOverviewResponse,
  TopPostsResponse,
  TrackAccountPreviewResponse,
} from "@/types/analytics";

export const analyticsRouter = {
  overview: authorizedProcedure
    .input(analyticsOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<SocialOverviewResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadSocialOverview(input.organizationId),
        toAnalyticsOrpcError
      );
    }),
  engagementTimeseries: authorizedProcedure
    .input(analyticsTimeseriesInputSchema)
    .handler(
      async ({ context, input }): Promise<EngagementTimeseriesResponse> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return await runOrpcEffect(
          loadEngagementTimeseries(input.organizationId, {
            days: input.days,
            timezone: input.timezone,
            dateFrom: input.dateFrom,
            dateTo: input.dateTo,
          }),
          toAnalyticsOrpcError
        );
      }
    ),
  topPosts: authorizedProcedure
    .input(analyticsTopPostsInputSchema)
    .handler(async ({ context, input }): Promise<TopPostsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadTopPosts(input.organizationId, input.limit, {
          timezone: input.timezone,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
        }),
        toAnalyticsOrpcError
      );
    }),
  adoption: authorizedProcedure
    .input(analyticsOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<NotraAdoptionResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadNotraAdoption(input.organizationId),
        toAnalyticsOrpcError
      );
    }),
  postingPerformance: authorizedProcedure
    .input(analyticsPostingPerformanceInputSchema)
    .handler(
      async ({ context, input }): Promise<PostingPerformanceResponse> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return await runOrpcEffect(
          loadPostingPerformance(input.organizationId, {
            days: input.days,
            timezone: input.timezone,
            dateFrom: input.dateFrom,
            dateTo: input.dateTo,
          }),
          toAnalyticsOrpcError
        );
      }
    ),
  leaderboard: authorizedProcedure
    .input(leaderboardInputSchema)
    .handler(async ({ context, input }): Promise<LeaderboardResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadLeaderboard(input.organizationId, input.days, {
          timezone: input.timezone,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
        }),
        toAnalyticsOrpcError
      );
    }),
  previewTrackAccount: authorizedProcedure
    .input(trackAccountInputSchema)
    .handler(
      async ({ context, input }): Promise<TrackAccountPreviewResponse> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return await runOrpcEffect(
          previewTrackedAccount(input.username),
          toAnalyticsOrpcError
        );
      }
    ),
  trackAccount: authorizedProcedure
    .input(trackAccountInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        trackTwitterAccount(input.organizationId, input.username),
        toAnalyticsOrpcError
      );
    }),
  untrackAccount: authorizedProcedure
    .input(untrackAccountInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        untrackTwitterAccount(input.organizationId, input.trackedAccountId),
        toAnalyticsOrpcError
      );
    }),
  followerGrowth: authorizedProcedure
    .input(analyticsTimeseriesInputSchema)
    .handler(async ({ context, input }): Promise<FollowerGrowthResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadFollowerGrowth(input.organizationId, {
          days: input.days,
          timezone: input.timezone,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
        }),
        toAnalyticsOrpcError
      );
    }),
};
