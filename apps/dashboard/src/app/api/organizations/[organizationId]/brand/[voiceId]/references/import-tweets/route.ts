import { db } from "@notra/db/drizzle";
import {
  brandReferences,
  brandSettings,
  connectedSocialAccounts,
} from "@notra/db/schema";
import { deleteBrandReferenceMemory } from "@notra/db/utils/supermemory";
import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { FEATURES } from "@/constants/features";
import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { autumn } from "@/lib/billing/autumn";
import { importTweetsSchema } from "@/schemas/brand";
import type { ApplicablePlatform } from "@/types/hooks/brand-references";
import type {
  TwitterTimelineResponse,
  TwitterTweet,
  TwitterUser,
} from "@/types/services/twitter";
import {
  type ReferenceMemoryRecord,
  syncBrandReferenceMemory,
} from "@/utils/brand-reference-memory";
import { ratelimit } from "@/utils/ratelimit";
import { twitterFetch } from "@/utils/twitter-auth";

interface RouteContext {
  params: Promise<{ organizationId: string; voiceId: string }>;
}

async function verifyVoiceOwnership(organizationId: string, voiceId: string) {
  return db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.id, voiceId),
      eq(brandSettings.organizationId, organizationId)
    ),
    columns: { id: true },
  });
}

async function fetchPinnedTweet(
  userId: string,
  account: {
    id: string;
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
  }
): Promise<TwitterTweet | null> {
  const params = new URLSearchParams({
    "user.fields": "pinned_tweet_id",
    expansions: "pinned_tweet_id",
    "tweet.fields":
      "text,created_at,public_metrics,author_id,referenced_tweets",
  });

  const res = await twitterFetch(
    `https://api.x.com/2/users/${userId}?${params.toString()}`,
    account
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return (data.includes?.tweets?.[0] as TwitterTweet | undefined) ?? null;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, voiceId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);
    if (!auth.success) {
      return auth.response;
    }

    const { success: withinLimit } =
      await ratelimit.importTweets.limit(organizationId);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Too many import requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const voice = await verifyVoiceOwnership(organizationId, voiceId);
    if (!voice) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = importTweetsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { accountId } = parsed.data;
    let maxResults = parsed.data.maxResults;

    if (autumn) {
      let data: {
        allowed?: boolean;
        balance?: { unlimited?: boolean; remaining?: number } | null;
      } | null = null;
      try {
        data = await autumn.check({
          customerId: organizationId,
          featureId: FEATURES.REFERENCES,
          requiredBalance: 1,
        });
      } catch {
        data = null;
      }
      if (!data?.allowed) {
        return NextResponse.json(
          {
            error: "Reference limit reached. Upgrade your plan to import more.",
          },
          { status: 403 }
        );
      }
      if (
        !data.balance?.unlimited &&
        typeof data.balance?.remaining === "number"
      ) {
        maxResults = Math.min(maxResults, data.balance.remaining);
      }
    }

    const socialAccount = await db.query.connectedSocialAccounts.findFirst({
      where: and(
        eq(connectedSocialAccounts.id, accountId),
        eq(connectedSocialAccounts.organizationId, organizationId),
        eq(connectedSocialAccounts.provider, "twitter")
      ),
    });

    if (!socialAccount) {
      return NextResponse.json(
        { error: "Connected X account not found" },
        { status: 404 }
      );
    }

    const pinnedTweet = await fetchPinnedTweet(
      socialAccount.providerAccountId,
      socialAccount
    );

    const originalTweets: TwitterTweet[] = [];
    let author: TwitterUser | undefined;
    let paginationToken: string | undefined;
    const maxPages = 5;

    for (let page = 0; page < maxPages; page++) {
      const remaining = maxResults - originalTweets.length;
      const perPage = Math.min(20, Math.max(5, remaining));

      const tweetParams = new URLSearchParams({
        max_results: String(perPage),
        exclude: "replies,retweets",
        "tweet.fields":
          "text,created_at,public_metrics,author_id,referenced_tweets",
        "user.fields": "username,name,profile_image_url",
        expansions: "author_id",
      });

      if (paginationToken) {
        tweetParams.set("pagination_token", paginationToken);
      }

      const tweetsRes = await twitterFetch(
        `https://api.x.com/2/users/${socialAccount.providerAccountId}/tweets?${tweetParams.toString()}`,
        socialAccount
      );

      if (!tweetsRes.ok) {
        if (page === 0) {
          const errorBody = await tweetsRes.json().catch(() => ({}));
          const message =
            (errorBody as Record<string, string>)?.detail ||
            (errorBody as Record<string, string>)?.title ||
            "Failed to fetch tweets from X";
          return NextResponse.json({ error: message }, { status: 400 });
        }
        break;
      }

      const timeline: TwitterTimelineResponse = await tweetsRes.json();

      if (!author && timeline.includes?.users) {
        author =
          timeline.includes.users.find(
            (u) => u.id === socialAccount.providerAccountId
          ) ?? timeline.includes.users[0];
      }

      const filtered = (timeline.data ?? []).filter(
        (t) =>
          !t.referenced_tweets?.some(
            (ref) => ref.type === "quoted" || ref.type === "replied_to"
          )
      );

      for (const tweet of filtered) {
        originalTweets.push(tweet);
        if (originalTweets.length >= maxResults) {
          break;
        }
      }

      if (originalTweets.length >= maxResults || !timeline.meta?.next_token) {
        break;
      }

      paginationToken = timeline.meta.next_token;
    }

    let tweets = originalTweets;

    const isPinnedOriginal =
      pinnedTweet &&
      !pinnedTweet.referenced_tweets?.some(
        (ref) => ref.type === "quoted" || ref.type === "replied_to"
      );

    if (isPinnedOriginal) {
      tweets = tweets.filter((t) => t.id !== pinnedTweet.id);
      tweets.unshift(pinnedTweet);
    }

    tweets = tweets.slice(0, maxResults);

    if (tweets.length === 0) {
      return NextResponse.json({ count: 0, references: [] });
    }

    const authorHandle = author?.username ?? socialAccount.username;
    const authorName = author?.name ?? socialAccount.displayName;
    const profileImageUrl = author?.profile_image_url
      ? normalizeTwitterProfileImageUrl(author.profile_image_url)
      : socialAccount.profileImageUrl;

    const incomingIds = tweets.map((t) => t.id);
    const existingRefs = await db.query.brandReferences.findMany({
      where: and(
        eq(brandReferences.brandSettingsId, voiceId),
        sql`${brandReferences.metadata}->>'tweetId' = ANY(ARRAY[${sql.join(
          incomingIds.map((id) => sql`${id}`),
          sql`, `
        )}]::text[])`
      ),
      columns: { metadata: true },
    });

    const existingTweetIds = new Set(
      existingRefs
        .map((r) => (r.metadata as Record<string, unknown> | null)?.tweetId)
        .filter(Boolean)
    );

    const newTweets = tweets.filter((t) => !existingTweetIds.has(t.id));

    if (newTweets.length === 0) {
      return NextResponse.json({ count: 0, references: [] });
    }

    const values = newTweets.map((tweet) => ({
      id: crypto.randomUUID(),
      brandSettingsId: voiceId,
      type: "twitter_post" as const,
      content: tweet.text,
      metadata: {
        tweetId: tweet.id,
        authorHandle,
        authorName,
        url: `https://x.com/${authorHandle}/status/${tweet.id}`,
        likes: tweet.public_metrics?.like_count ?? 0,
        retweets: tweet.public_metrics?.retweet_count ?? 0,
        replies: tweet.public_metrics?.reply_count ?? 0,
        profileImageUrl,
        createdAt: tweet.created_at ?? new Date().toISOString(),
      },
      note: null,
      applicableTo: ["twitter"] as ApplicablePlatform[],
    }));

    const inserted = await db
      .insert(brandReferences)
      .values(values)
      .returning();

    let syncedCount = 0;

    for (const reference of inserted) {
      let createdDocumentId: string | null = null;

      try {
        const link = await syncBrandReferenceMemory({
          organizationId,
          voiceId,
          reference: reference as ReferenceMemoryRecord,
        });
        createdDocumentId = link.documentId;

        await db
          .update(brandReferences)
          .set({
            supermemoryDocumentId: link.documentId,
            supermemoryMemoryId: link.memoryId,
            supermemorySyncedAt: new Date(),
            supermemoryLastSyncError: null,
          })
          .where(eq(brandReferences.id, reference.id));
        syncedCount += 1;
      } catch (error) {
        console.error("Error syncing imported tweet to Supermemory:", error);

        if (createdDocumentId) {
          try {
            await deleteBrandReferenceMemory({ documentId: createdDocumentId });
          } catch (cleanupError) {
            console.error(
              "Error cleaning up imported Supermemory reference:",
              cleanupError
            );
          }
        }

        await db
          .update(brandReferences)
          .set({
            supermemoryLastSyncError:
              error instanceof Error
                ? error.message
                : "Supermemory sync failed during import",
          })
          .where(eq(brandReferences.id, reference.id));
      }
    }

    if (autumn && syncedCount > 0) {
      await autumn.track({
        customerId: organizationId,
        featureId: FEATURES.REFERENCES,
        value: syncedCount,
      });
    }

    const syncedReferences = await db.query.brandReferences.findMany({
      where: and(
        eq(brandReferences.brandSettingsId, voiceId),
        sql`${brandReferences.id} = ANY(ARRAY[${sql.join(
          inserted.map((reference) => sql`${reference.id}`),
          sql`, `
        )}]::text[])`
      ),
    });

    return NextResponse.json(
      { count: syncedReferences.length, references: syncedReferences },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import tweets";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
