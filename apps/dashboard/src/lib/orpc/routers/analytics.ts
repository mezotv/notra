import {
  ingestSocialAccountStats,
  ingestSocialAccounts,
  ingestSocialPostStats,
  ingestSocialPosts,
  isTinybirdConfigured,
  queryAccountLeaderboard,
  queryEngagementTimeseries,
  queryFollowerGrowth,
  queryNotraAdoption,
  queryPostingPerformance,
  querySocialOverview,
  queryTopPosts,
} from "@notra/analytics/tinybird/client";
import { db } from "@notra/db/drizzle";
import {
  connectedSocialAccounts,
  organizations,
  posts,
  trackedSocialAccounts,
} from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { buildLeaderboardEntries } from "@/lib/analytics/leaderboard";
import { buildAccountRow } from "@/lib/analytics/rows";
import { resolveTwitterAccount } from "@/lib/analytics/tracked-accounts";
import { collectTwitterRows } from "@/lib/analytics/twitter-sync";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import {
  analyticsOrganizationInputSchema,
  analyticsTimeseriesInputSchema,
  analyticsTopPostsInputSchema,
  leaderboardInputSchema,
  trackAccountInputSchema,
  untrackAccountInputSchema,
} from "@/schemas/analytics";
import type {
  EngagementTimeseriesResponse,
  FollowerGrowthResponse,
  LeaderboardAccount,
  LeaderboardResponse,
  NotraAdoptionResponse,
  PostingPerformanceResponse,
  SocialOverviewAccount,
  SocialOverviewResponse,
  SyncableSocialAccount,
  TopPostsResponse,
  TrackAccountPreviewResponse,
} from "@/types/analytics";
import { badRequest, notFound } from "../utils/errors";

function toNullableNumber(value: number | bigint | null): number | null {
  if (value === null) {
    return null;
  }
  return Number(value);
}

async function syncTrackedAccountNow(
  account: SyncableSocialAccount
): Promise<void> {
  const capturedAt = new Date();
  await ingestSocialAccounts([buildAccountRow(account, capturedAt)]);
  const rows = await collectTwitterRows([account], capturedAt);
  await ingestSocialAccountStats(rows.accountStats);
  await ingestSocialPosts(rows.posts);
  await ingestSocialPostStats(rows.postStats);
}

export const analyticsRouter = {
  overview: authorizedProcedure
    .input(analyticsOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<SocialOverviewResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const accounts = await db.query.connectedSocialAccounts.findMany({
        columns: {
          id: true,
          provider: true,
          providerAccountId: true,
          username: true,
          displayName: true,
          profileImageUrl: true,
          verified: true,
        },
        where: eq(connectedSocialAccounts.organizationId, input.organizationId),
      });

      const configured = isTinybirdConfigured();
      const result = configured
        ? await querySocialOverview({
            organization_id: input.organizationId,
          }).catch((error) => {
            console.error("[Analytics] overview query failed:", error);
            return null;
          })
        : null;

      const statsByAccount = new Map(
        (result?.data ?? []).map((row) => [
          `${row.provider}:${row.provider_account_id}`,
          row,
        ])
      );

      const overviewAccounts: SocialOverviewAccount[] = accounts.map(
        (account) => {
          const stats = statsByAccount.get(
            `${account.provider}:${account.providerAccountId}`
          );
          return {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accountId: account.id,
            username: account.username,
            displayName: account.displayName,
            profileImageUrl: account.profileImageUrl,
            verified: account.verified ?? false,
            followersCount: toNullableNumber(stats?.followers_count ?? null),
            followingCount: toNullableNumber(stats?.following_count ?? null),
            postsCount: toNullableNumber(stats?.posts_count ?? null),
            trackedPosts: toNullableNumber(stats?.tracked_posts ?? null),
            impressions: toNullableNumber(stats?.impressions ?? null),
            likes: toNullableNumber(stats?.likes ?? null),
            replies: toNullableNumber(stats?.replies ?? null),
            reposts: toNullableNumber(stats?.reposts ?? null),
            quotes: toNullableNumber(stats?.quotes ?? null),
            bookmarks: toNullableNumber(stats?.bookmarks ?? null),
            statsCapturedAt: stats?.stats_captured_at ?? null,
          };
        }
      );

      return { configured, accounts: overviewAccounts };
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

        const result = await queryEngagementTimeseries({
          organization_id: input.organizationId,
          days: input.days,
        }).catch((error) => {
          console.error("[Analytics] query failed:", error);
          return null;
        });

        return {
          configured: isTinybirdConfigured(),
          points: (result?.data ?? []).map((row) => ({
            day: row.day,
            provider: row.provider,
            providerAccountId: row.provider_account_id,
            posts: Number(row.posts),
            impressions: toNullableNumber(row.impressions),
            likes: toNullableNumber(row.likes),
            replies: toNullableNumber(row.replies),
            reposts: toNullableNumber(row.reposts),
          })),
        };
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

      const [result, accounts] = await Promise.all([
        queryTopPosts({
          organization_id: input.organizationId,
          limit: input.limit,
        }).catch((error) => {
          console.error("[Analytics] top posts query failed:", error);
          return null;
        }),
        db.query.connectedSocialAccounts.findMany({
          columns: {
            provider: true,
            providerAccountId: true,
            username: true,
            profileImageUrl: true,
          },
          where: eq(
            connectedSocialAccounts.organizationId,
            input.organizationId
          ),
        }),
      ]);

      const accountsByKey = new Map(
        accounts.map((account) => [
          `${account.provider}:${account.providerAccountId}`,
          account,
        ])
      );

      return {
        configured: isTinybirdConfigured(),
        posts: (result?.data ?? []).map((row) => {
          const account = accountsByKey.get(
            `${row.provider}:${row.provider_account_id}`
          );
          return {
            provider: row.provider,
            platformPostId: row.platform_post_id,
            providerAccountId: row.provider_account_id,
            username: account?.username ?? null,
            profileImageUrl: account?.profileImageUrl ?? null,
            content: row.content,
            url: row.url,
            postedAt: row.posted_at,
            impressions: toNullableNumber(row.impressions),
            likes: toNullableNumber(row.likes),
            replies: toNullableNumber(row.replies),
            reposts: toNullableNumber(row.reposts),
            bookmarks: toNullableNumber(row.bookmarks),
            engagement: Number(row.engagement),
          };
        }),
      };
    }),
  adoption: authorizedProcedure
    .input(analyticsOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<NotraAdoptionResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [organization, firstPublishedPost, adoptionResult] =
        await Promise.all([
          db.query.organizations.findFirst({
            columns: { createdAt: true },
            where: eq(organizations.id, input.organizationId),
          }),
          db.query.posts.findFirst({
            columns: { createdAt: true },
            where: and(
              eq(posts.organizationId, input.organizationId),
              eq(posts.status, "published")
            ),
            orderBy: [asc(posts.createdAt)],
          }),
          queryNotraAdoption({ organization_id: input.organizationId }).catch(
            (error) => {
              console.error("[Analytics] adoption query failed:", error);
              return null;
            }
          ),
        ]);

      const adoptionRow = adoptionResult?.data.at(0);
      const trackedFirstPost = adoptionRow?.first_notra_post_at ?? null;

      return {
        configured: isTinybirdConfigured(),
        organizationCreatedAt: organization?.createdAt.toISOString() ?? null,
        firstNotraPostAt:
          trackedFirstPost ??
          firstPublishedPost?.createdAt.toISOString() ??
          null,
        notraPosts: Number(adoptionRow?.notra_posts ?? 0),
      };
    }),
  postingPerformance: authorizedProcedure
    .input(analyticsTimeseriesInputSchema)
    .handler(
      async ({ context, input }): Promise<PostingPerformanceResponse> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        const result = await queryPostingPerformance({
          organization_id: input.organizationId,
          days: input.days,
        }).catch((error) => {
          console.error("[Analytics] posting performance query failed:", error);
          return null;
        });

        return {
          configured: isTinybirdConfigured(),
          points: (result?.data ?? []).map((row) => ({
            weekday: Number(row.weekday),
            posts: Number(row.posts),
            engagement: Number(row.engagement),
            impressions: toNullableNumber(row.impressions),
            avgEngagement: Number(row.avg_engagement),
          })),
        };
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

      const [connected, tracked, result] = await Promise.all([
        db.query.connectedSocialAccounts.findMany({
          columns: {
            provider: true,
            providerAccountId: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            verified: true,
            verifiedType: true,
          },
          where: eq(
            connectedSocialAccounts.organizationId,
            input.organizationId
          ),
        }),
        db.query.trackedSocialAccounts.findMany({
          columns: {
            id: true,
            provider: true,
            providerAccountId: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            verified: true,
            verifiedType: true,
          },
          where: eq(trackedSocialAccounts.organizationId, input.organizationId),
        }),
        queryAccountLeaderboard({
          organization_id: input.organizationId,
          days: input.days,
        }).catch((error) => {
          console.error("[Analytics] leaderboard query failed:", error);
          return null;
        }),
      ]);

      const connectedKeys = new Set(
        connected.flatMap((account) => [
          `${account.provider}:${account.providerAccountId}`,
          `${account.provider}:@${account.username.toLowerCase()}`,
        ])
      );

      const accounts: LeaderboardAccount[] = [
        ...connected.map((account) => ({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          username: account.username,
          displayName: account.displayName,
          profileImageUrl: account.profileImageUrl,
          verified: account.verified ?? false,
          verifiedType: account.verifiedType,
          isConnected: true,
          trackedAccountId: null,
        })),
        ...tracked
          .filter(
            (account) =>
              !(
                connectedKeys.has(
                  `${account.provider}:${account.providerAccountId}`
                ) ||
                connectedKeys.has(
                  `${account.provider}:@${account.username.toLowerCase()}`
                )
              )
          )
          .map((account) => ({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            username: account.username,
            displayName: account.displayName,
            profileImageUrl: account.profileImageUrl,
            verified: account.verified,
            verifiedType: account.verifiedType,
            isConnected: false,
            trackedAccountId: account.id,
          })),
      ];

      const totals = (result?.data ?? []).map((row) => ({
        provider: row.provider,
        providerAccountId: row.provider_account_id,
        posts: Number(row.posts),
        interactions: Number(row.interactions),
        impressions: Number(row.impressions),
        previousPosts: Number(row.prev_posts),
        previousInteractions: Number(row.prev_interactions),
        previousImpressions: Number(row.prev_impressions),
      }));

      return {
        configured: isTinybirdConfigured(),
        days: input.days,
        entries: buildLeaderboardEntries(accounts, totals),
      };
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

        const account = await resolveTwitterAccount(input.username).catch(
          (error) => {
            console.error("[Analytics] account preview failed:", error);
            return null;
          }
        );
        return { account };
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

      const resolved = await resolveTwitterAccount(input.username);
      if (!resolved) {
        throw badRequest(`Could not find the X account @${input.username}`);
      }

      const connectedTwitterAccounts =
        await db.query.connectedSocialAccounts.findMany({
          columns: { providerAccountId: true, username: true },
          where: and(
            eq(connectedSocialAccounts.organizationId, input.organizationId),
            eq(connectedSocialAccounts.provider, "twitter")
          ),
        });
      const existingConnected = connectedTwitterAccounts.some(
        (account) =>
          account.providerAccountId === resolved.providerAccountId ||
          account.username.toLowerCase() === resolved.username.toLowerCase()
      );
      if (existingConnected) {
        return { trackedAccountId: null, username: resolved.username };
      }

      const existingTracked = await db.query.trackedSocialAccounts.findFirst({
        columns: { id: true },
        where: and(
          eq(trackedSocialAccounts.organizationId, input.organizationId),
          eq(trackedSocialAccounts.provider, "twitter"),
          eq(
            trackedSocialAccounts.providerAccountId,
            resolved.providerAccountId
          )
        ),
      });
      if (existingTracked) {
        return {
          trackedAccountId: existingTracked.id,
          username: resolved.username,
        };
      }

      const trackedAccountId = crypto.randomUUID();
      await db.insert(trackedSocialAccounts).values({
        id: trackedAccountId,
        organizationId: input.organizationId,
        provider: "twitter",
        providerAccountId: resolved.providerAccountId,
        username: resolved.username,
        displayName: resolved.displayName,
        profileImageUrl: resolved.profileImageUrl,
        verified: resolved.verified,
        verifiedType: resolved.verifiedType,
      });

      try {
        await syncTrackedAccountNow({
          id: trackedAccountId,
          organizationId: input.organizationId,
          provider: "twitter",
          providerAccountId: resolved.providerAccountId,
          username: resolved.username,
          displayName: resolved.displayName,
          profileImageUrl: resolved.profileImageUrl,
          verified: false,
        });
      } catch (error) {
        console.error("[Analytics] tracked account sync failed:", error);
      }

      return { trackedAccountId, username: resolved.username };
    }),
  untrackAccount: authorizedProcedure
    .input(untrackAccountInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const deleted = await db
        .delete(trackedSocialAccounts)
        .where(
          and(
            eq(trackedSocialAccounts.id, input.trackedAccountId),
            eq(trackedSocialAccounts.organizationId, input.organizationId)
          )
        )
        .returning({ id: trackedSocialAccounts.id });

      if (deleted.length === 0) {
        throw notFound("Tracked account not found");
      }

      return { trackedAccountId: input.trackedAccountId };
    }),
  followerGrowth: authorizedProcedure
    .input(analyticsTimeseriesInputSchema)
    .handler(async ({ context, input }): Promise<FollowerGrowthResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const result = await queryFollowerGrowth({
        organization_id: input.organizationId,
        days: input.days,
      }).catch((error) => {
        console.error("[Analytics] follower growth query failed:", error);
        return null;
      });

      return {
        configured: isTinybirdConfigured(),
        points: (result?.data ?? []).map((row) => ({
          day: row.day,
          provider: row.provider,
          providerAccountId: row.provider_account_id,
          followersCount: toNullableNumber(row.followers_count),
        })),
      };
    }),
};
