import type {
  SocialAccountRow,
  SocialAccountStatsRow,
  SocialPostRow,
  SocialPostStatsRow,
} from "@notra/analytics/tinybird/datasources";
import { toClickHouseDateTime } from "@notra/analytics/utils/datetime";

import type {
  SyncableSocialAccount,
  TwitterBatchUser,
  TwitterTimelineTweet,
} from "@/types/analytics";

export function buildAccountRow(
  account: SyncableSocialAccount,
  capturedAt: Date
): SocialAccountRow {
  return {
    organization_id: account.organizationId,
    account_id: account.id,
    provider: account.provider,
    provider_account_id: account.providerAccountId,
    username: account.username,
    display_name: account.displayName,
    profile_image_url: account.profileImageUrl,
    profile_url: null,
    account_type: null,
    verified: account.verified,
    captured_at: toClickHouseDateTime(capturedAt),
  };
}

export function buildTwitterAccountStatsRow(
  account: SyncableSocialAccount,
  user: TwitterBatchUser,
  capturedAt: Date
): SocialAccountStatsRow {
  const metrics = user.public_metrics;
  return {
    organization_id: account.organizationId,
    account_id: account.id,
    provider: account.provider,
    provider_account_id: account.providerAccountId,
    captured_at: toClickHouseDateTime(capturedAt),
    followers_count: metrics?.followers_count ?? null,
    following_count: metrics?.following_count ?? null,
    posts_count: metrics?.tweet_count ?? null,
    listed_count: metrics?.listed_count ?? null,
  };
}

export function buildTweetPostRow(
  account: SyncableSocialAccount,
  tweet: TwitterTimelineTweet,
  capturedAt: Date
): SocialPostRow {
  return {
    organization_id: account.organizationId,
    account_id: account.id,
    provider: account.provider,
    provider_account_id: account.providerAccountId,
    platform_post_id: tweet.id,
    url: `https://x.com/${account.username}/status/${tweet.id}`,
    content: tweet.text,
    posted_at: toClickHouseDateTime(
      tweet.created_at ? new Date(tweet.created_at) : capturedAt
    ),
    captured_at: toClickHouseDateTime(capturedAt),
  };
}

export function buildTweetStatsRow(
  account: SyncableSocialAccount,
  tweet: TwitterTimelineTweet,
  capturedAt: Date
): SocialPostStatsRow {
  const metrics = tweet.public_metrics;
  return {
    organization_id: account.organizationId,
    provider: account.provider,
    provider_account_id: account.providerAccountId,
    platform_post_id: tweet.id,
    captured_at: toClickHouseDateTime(capturedAt),
    impressions: metrics?.impression_count ?? null,
    likes: metrics?.like_count ?? null,
    replies: metrics?.reply_count ?? null,
    reposts: metrics?.retweet_count ?? null,
    quotes: metrics?.quote_count ?? null,
    bookmarks: metrics?.bookmark_count ?? null,
  };
}
