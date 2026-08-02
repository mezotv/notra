import {
  defineCopyPipe,
  defineEndpoint,
  defineMaterializedView,
  type InferOutputRow,
  type InferParams,
  node,
  p,
  t,
} from "@tinybirdco/sdk";
import { socialAccountStatsLatest, socialPostStatsLatest } from "./datasources";

const POST_STATS_LATEST_SQL = `
  SELECT
    organization_id,
    provider,
    provider_account_id,
    platform_post_id,
    argMaxState(impressions, captured_at) AS impressions_state,
    argMaxState(likes, captured_at) AS likes_state,
    argMaxState(replies, captured_at) AS replies_state,
    argMaxState(reposts, captured_at) AS reposts_state,
    argMaxState(quotes, captured_at) AS quotes_state,
    argMaxState(bookmarks, captured_at) AS bookmarks_state,
    maxState(captured_at) AS last_captured_at_state
  FROM social_post_stats
  GROUP BY organization_id, provider, provider_account_id, platform_post_id
`;

const ACCOUNT_STATS_LATEST_SQL = `
  SELECT
    organization_id,
    provider,
    provider_account_id,
    argMaxState(account_id, captured_at) AS account_id_state,
    argMaxState(followers_count, captured_at) AS followers_count_state,
    argMaxState(following_count, captured_at) AS following_count_state,
    argMaxState(posts_count, captured_at) AS posts_count_state,
    argMaxState(listed_count, captured_at) AS listed_count_state,
    maxState(captured_at) AS last_captured_at_state
  FROM social_account_stats
  GROUP BY organization_id, provider, provider_account_id
`;

export const socialPostStatsLatestMv = defineMaterializedView(
  "social_post_stats_latest_mv",
  {
    description: "Keeps social_post_stats_latest current on every ingest batch",
    datasource: socialPostStatsLatest,
    nodes: [node({ name: "post_stats_latest", sql: POST_STATS_LATEST_SQL })],
  }
);

export const socialAccountStatsLatestMv = defineMaterializedView(
  "social_account_stats_latest_mv",
  {
    description:
      "Keeps social_account_stats_latest current on every ingest batch",
    datasource: socialAccountStatsLatest,
    nodes: [
      node({ name: "account_stats_latest", sql: ACCOUNT_STATS_LATEST_SQL }),
    ],
  }
);

export const socialPostStatsLatestBackfill = defineCopyPipe(
  "social_post_stats_latest_backfill",
  {
    description:
      "One-off backfill of social_post_stats_latest from history predating the materialized view; argMax states are idempotent so reruns are safe",
    datasource: socialPostStatsLatest,
    copy_mode: "append",
    copy_schedule: "@on-demand",
    nodes: [node({ name: "post_stats_backfill", sql: POST_STATS_LATEST_SQL })],
  }
);

export const socialAccountStatsLatestBackfill = defineCopyPipe(
  "social_account_stats_latest_backfill",
  {
    description:
      "One-off backfill of social_account_stats_latest from history predating the materialized view; argMax states are idempotent so reruns are safe",
    datasource: socialAccountStatsLatest,
    copy_mode: "append",
    copy_schedule: "@on-demand",
    nodes: [
      node({ name: "account_stats_backfill", sql: ACCOUNT_STATS_LATEST_SQL }),
    ],
  }
);

export const socialOverview = defineEndpoint("social_overview", {
  description:
    "Latest per-account snapshot with follower counts and lifetime engagement totals",
  params: {
    organization_id: p.string().describe("Organization id"),
  },
  nodes: [
    node({
      name: "latest_account_stats",
      sql: `
        SELECT
          provider,
          provider_account_id,
          argMaxMerge(account_id_state) AS account_id,
          argMaxMerge(followers_count_state) AS followers_count,
          argMaxMerge(following_count_state) AS following_count,
          argMaxMerge(posts_count_state) AS posts_count,
          maxMerge(last_captured_at_state) AS stats_captured_at
        FROM social_account_stats_latest
        WHERE organization_id = {{String(organization_id)}}
        GROUP BY provider, provider_account_id
      `,
    }),
    node({
      name: "latest_post_stats",
      sql: `
        SELECT
          provider,
          provider_account_id,
          count() AS tracked_posts,
          sum(impressions) AS impressions,
          sum(likes) AS likes,
          sum(replies) AS replies,
          sum(reposts) AS reposts,
          sum(quotes) AS quotes,
          sum(bookmarks) AS bookmarks
        FROM (
          SELECT
            provider,
            provider_account_id,
            platform_post_id,
            argMaxMerge(impressions_state) AS impressions,
            argMaxMerge(likes_state) AS likes,
            argMaxMerge(replies_state) AS replies,
            argMaxMerge(reposts_state) AS reposts,
            argMaxMerge(quotes_state) AS quotes,
            argMaxMerge(bookmarks_state) AS bookmarks
          FROM social_post_stats_latest
          WHERE organization_id = {{String(organization_id)}}
          GROUP BY provider, provider_account_id, platform_post_id
        )
        GROUP BY provider, provider_account_id
      `,
    }),
    node({
      name: "overview",
      sql: `
        SELECT
          accounts.provider AS provider,
          accounts.provider_account_id AS provider_account_id,
          argMax(accounts.account_id, accounts.captured_at) AS account_id,
          argMax(accounts.username, accounts.captured_at) AS username,
          argMax(accounts.display_name, accounts.captured_at) AS display_name,
          argMax(accounts.profile_image_url, accounts.captured_at) AS profile_image_url,
          argMax(accounts.verified, accounts.captured_at) AS verified,
          any(stats.followers_count) AS followers_count,
          any(stats.following_count) AS following_count,
          any(stats.posts_count) AS posts_count,
          any(posts.tracked_posts) AS tracked_posts,
          any(posts.impressions) AS impressions,
          any(posts.likes) AS likes,
          any(posts.replies) AS replies,
          any(posts.reposts) AS reposts,
          any(posts.quotes) AS quotes,
          any(posts.bookmarks) AS bookmarks,
          any(stats.stats_captured_at) AS stats_captured_at
        FROM social_accounts AS accounts
        LEFT JOIN latest_account_stats AS stats
          ON stats.provider = accounts.provider
          AND stats.provider_account_id = accounts.provider_account_id
        LEFT JOIN latest_post_stats AS posts
          ON posts.provider = accounts.provider
          AND posts.provider_account_id = accounts.provider_account_id
        WHERE accounts.organization_id = {{String(organization_id)}}
        GROUP BY accounts.provider, accounts.provider_account_id
        ORDER BY followers_count DESC NULLS LAST
      `,
    }),
  ],
  output: {
    provider: t.string(),
    provider_account_id: t.string(),
    account_id: t.string(),
    username: t.string(),
    display_name: t.string().nullable(),
    profile_image_url: t.string().nullable(),
    verified: t.bool(),
    followers_count: t.uint64().nullable(),
    following_count: t.uint64().nullable(),
    posts_count: t.uint64().nullable(),
    tracked_posts: t.uint64().nullable(),
    impressions: t.uint64().nullable(),
    likes: t.uint64().nullable(),
    replies: t.uint64().nullable(),
    reposts: t.uint64().nullable(),
    quotes: t.uint64().nullable(),
    bookmarks: t.uint64().nullable(),
    stats_captured_at: t.dateTime().nullable(),
  },
});

export const engagementTimeseries = defineEndpoint("engagement_timeseries", {
  description:
    "Daily post counts and engagement per account, attributed to each post's publish date",
  params: {
    organization_id: p.string().describe("Organization id"),
    days: p.int32().optional(30).describe("Number of trailing days"),
  },
  nodes: [
    node({
      name: "post_days",
      sql: `
        SELECT
          provider,
          platform_post_id,
          argMax(provider_account_id, captured_at) AS provider_account_id,
          min(posted_at) AS first_posted_at
        FROM social_posts
        WHERE organization_id = {{String(organization_id)}}
          AND posted_at >= now() - toIntervalDay({{Int32(days, 30)}})
        GROUP BY provider, platform_post_id
      `,
    }),
    node({
      name: "latest_post_metrics",
      sql: `
        SELECT
          provider,
          platform_post_id,
          argMaxMerge(impressions_state) AS impressions,
          argMaxMerge(likes_state) AS likes,
          argMaxMerge(replies_state) AS replies,
          argMaxMerge(reposts_state) AS reposts
        FROM social_post_stats_latest
        WHERE organization_id = {{String(organization_id)}}
        GROUP BY provider, platform_post_id
      `,
    }),
    node({
      name: "daily_totals",
      sql: `
        SELECT
          toDate(posts.first_posted_at) AS day,
          posts.provider AS provider,
          posts.provider_account_id AS provider_account_id,
          count() AS posts,
          sum(stats.impressions) AS impressions,
          sum(stats.likes) AS likes,
          sum(stats.replies) AS replies,
          sum(stats.reposts) AS reposts
        FROM post_days AS posts
        LEFT JOIN latest_post_metrics AS stats
          ON stats.provider = posts.provider
          AND stats.platform_post_id = posts.platform_post_id
        GROUP BY day, provider, provider_account_id
        ORDER BY day ASC
      `,
    }),
  ],
  output: {
    day: t.date(),
    provider: t.string(),
    provider_account_id: t.string(),
    posts: t.uint64(),
    impressions: t.uint64().nullable(),
    likes: t.uint64().nullable(),
    replies: t.uint64().nullable(),
    reposts: t.uint64().nullable(),
  },
});

export const accountLeaderboard = defineEndpoint("account_leaderboard", {
  description:
    "Per-account interactions for the trailing window and the window before it",
  params: {
    organization_id: p.string().describe("Organization id"),
    days: p.int32().optional(7).describe("Length of each window in days"),
  },
  nodes: [
    node({
      name: "leaderboard_window_posts",
      sql: `
        SELECT
          provider,
          platform_post_id,
          argMax(provider_account_id, captured_at) AS provider_account_id,
          min(posted_at) AS first_posted_at
        FROM social_posts
        WHERE organization_id = {{String(organization_id)}}
          AND posted_at >= now() - toIntervalDay({{Int32(days, 7)}} * 2)
          AND posted_at <= now()
        GROUP BY provider, platform_post_id
      `,
    }),
    node({
      name: "leaderboard_post_metrics",
      sql: `
        SELECT
          provider,
          platform_post_id,
          argMaxMerge(impressions_state) AS impressions,
          argMaxMerge(likes_state) AS likes,
          argMaxMerge(replies_state) AS replies,
          argMaxMerge(reposts_state) AS reposts
        FROM social_post_stats_latest
        WHERE organization_id = {{String(organization_id)}}
        GROUP BY provider, platform_post_id
      `,
    }),
    node({
      name: "leaderboard_totals",
      sql: `
        SELECT
          window_posts.provider AS provider,
          window_posts.provider_account_id AS provider_account_id,
          countIf(window_posts.first_posted_at >= now() - toIntervalDay({{Int32(days, 7)}})) AS posts,
          sumIf(
            coalesce(metrics.likes, 0) + coalesce(metrics.replies, 0) + coalesce(metrics.reposts, 0),
            window_posts.first_posted_at >= now() - toIntervalDay({{Int32(days, 7)}})
          ) AS interactions,
          sumIf(
            coalesce(metrics.impressions, 0),
            window_posts.first_posted_at >= now() - toIntervalDay({{Int32(days, 7)}})
          ) AS impressions,
          countIf(window_posts.first_posted_at < now() - toIntervalDay({{Int32(days, 7)}})) AS prev_posts,
          sumIf(
            coalesce(metrics.likes, 0) + coalesce(metrics.replies, 0) + coalesce(metrics.reposts, 0),
            window_posts.first_posted_at < now() - toIntervalDay({{Int32(days, 7)}})
          ) AS prev_interactions,
          sumIf(
            coalesce(metrics.impressions, 0),
            window_posts.first_posted_at < now() - toIntervalDay({{Int32(days, 7)}})
          ) AS prev_impressions
        FROM leaderboard_window_posts AS window_posts
        LEFT JOIN leaderboard_post_metrics AS metrics
          ON metrics.provider = window_posts.provider
          AND metrics.platform_post_id = window_posts.platform_post_id
        GROUP BY window_posts.provider, window_posts.provider_account_id
        ORDER BY interactions DESC
      `,
    }),
  ],
  output: {
    provider: t.string(),
    provider_account_id: t.string(),
    posts: t.uint64(),
    interactions: t.uint64(),
    impressions: t.uint64(),
    prev_posts: t.uint64(),
    prev_interactions: t.uint64(),
    prev_impressions: t.uint64(),
  },
});

export type AccountLeaderboardParams = InferParams<typeof accountLeaderboard>;
export type AccountLeaderboardRow = InferOutputRow<typeof accountLeaderboard>;

export const topPosts = defineEndpoint("top_posts", {
  description: "Best performing posts by latest engagement snapshot",
  params: {
    organization_id: p.string().describe("Organization id"),
    limit: p.int32().optional(10).describe("Number of posts"),
  },
  nodes: [
    node({
      name: "latest_stats",
      sql: `
        SELECT
          provider,
          platform_post_id,
          argMaxMerge(impressions_state) AS impressions,
          argMaxMerge(likes_state) AS likes,
          argMaxMerge(replies_state) AS replies,
          argMaxMerge(reposts_state) AS reposts,
          argMaxMerge(bookmarks_state) AS bookmarks
        FROM social_post_stats_latest
        WHERE organization_id = {{String(organization_id)}}
        GROUP BY provider, platform_post_id
      `,
    }),
    node({
      name: "ranked",
      sql: `
        SELECT
          posts.provider AS provider,
          posts.platform_post_id AS platform_post_id,
          argMax(posts.content, posts.captured_at) AS content,
          argMax(posts.url, posts.captured_at) AS url,
          argMax(posts.provider_account_id, posts.captured_at) AS provider_account_id,
          min(posts.posted_at) AS posted_at,
          any(stats.impressions) AS impressions,
          any(stats.likes) AS likes,
          any(stats.replies) AS replies,
          any(stats.reposts) AS reposts,
          any(stats.bookmarks) AS bookmarks,
          coalesce(any(stats.likes), 0)
            + coalesce(any(stats.replies), 0)
            + coalesce(any(stats.reposts), 0) AS engagement
        FROM social_posts AS posts
        LEFT JOIN latest_stats AS stats
          ON stats.provider = posts.provider
          AND stats.platform_post_id = posts.platform_post_id
        WHERE posts.organization_id = {{String(organization_id)}}
        GROUP BY posts.provider, posts.platform_post_id
        ORDER BY engagement DESC, posted_at DESC
        LIMIT {{Int32(limit, 10)}}
      `,
    }),
  ],
  output: {
    provider: t.string(),
    platform_post_id: t.string(),
    provider_account_id: t.string(),
    content: t.string(),
    url: t.string().nullable(),
    posted_at: t.dateTime(),
    impressions: t.uint64().nullable(),
    likes: t.uint64().nullable(),
    replies: t.uint64().nullable(),
    reposts: t.uint64().nullable(),
    bookmarks: t.uint64().nullable(),
    engagement: t.uint64(),
  },
});

export const postingPerformance = defineEndpoint("posting_performance", {
  description:
    "Post volume and average engagement grouped by weekday of publish",
  params: {
    organization_id: p.string().describe("Organization id"),
    days: p.int32().optional(90).describe("Number of trailing days"),
  },
  nodes: [
    node({
      name: "post_weekdays",
      sql: `
        SELECT
          provider,
          platform_post_id,
          toDayOfWeek(min(posted_at)) AS weekday
        FROM social_posts
        WHERE organization_id = {{String(organization_id)}}
          AND posted_at >= now() - toIntervalDay({{Int32(days, 90)}})
        GROUP BY provider, platform_post_id
      `,
    }),
    node({
      name: "post_metrics",
      sql: `
        SELECT
          provider,
          platform_post_id,
          argMaxMerge(likes_state) AS likes,
          argMaxMerge(replies_state) AS replies,
          argMaxMerge(reposts_state) AS reposts,
          argMaxMerge(impressions_state) AS impressions
        FROM social_post_stats_latest
        WHERE organization_id = {{String(organization_id)}}
        GROUP BY provider, platform_post_id
      `,
    }),
    node({
      name: "weekday_totals",
      sql: `
        SELECT
          posts.weekday AS weekday,
          count() AS posts,
          sum(coalesce(stats.likes, 0) + coalesce(stats.replies, 0) + coalesce(stats.reposts, 0)) AS engagement,
          sum(stats.impressions) AS impressions,
          round(sum(coalesce(stats.likes, 0) + coalesce(stats.replies, 0) + coalesce(stats.reposts, 0)) / count(), 1) AS avg_engagement
        FROM post_weekdays AS posts
        LEFT JOIN post_metrics AS stats
          ON stats.provider = posts.provider
          AND stats.platform_post_id = posts.platform_post_id
        GROUP BY weekday
        ORDER BY weekday ASC
      `,
    }),
  ],
  output: {
    weekday: t.uint64(),
    posts: t.uint64(),
    engagement: t.uint64(),
    impressions: t.uint64().nullable(),
    avg_engagement: t.float64(),
  },
});

export type PostingPerformanceParams = InferParams<typeof postingPerformance>;
export type PostingPerformanceRow = InferOutputRow<typeof postingPerformance>;

export const followerGrowth = defineEndpoint("follower_growth", {
  description: "Daily follower counts per account",
  params: {
    organization_id: p.string().describe("Organization id"),
    days: p.int32().optional(30).describe("Number of trailing days"),
  },
  nodes: [
    node({
      name: "daily_followers",
      sql: `
        SELECT
          toDate(captured_at) AS day,
          provider,
          provider_account_id,
          argMax(followers_count, captured_at) AS followers_count
        FROM social_account_stats
        WHERE organization_id = {{String(organization_id)}}
          AND captured_at >= now() - toIntervalDay({{Int32(days, 30)}})
        GROUP BY day, provider, provider_account_id
        ORDER BY day ASC
      `,
    }),
  ],
  output: {
    day: t.date(),
    provider: t.string(),
    provider_account_id: t.string(),
    followers_count: t.uint64().nullable(),
  },
});

export type SocialOverviewParams = InferParams<typeof socialOverview>;
export type SocialOverviewRow = InferOutputRow<typeof socialOverview>;
export type EngagementTimeseriesParams = InferParams<
  typeof engagementTimeseries
>;
export type EngagementTimeseriesRow = InferOutputRow<
  typeof engagementTimeseries
>;
export type TopPostsParams = InferParams<typeof topPosts>;
export type TopPostsRow = InferOutputRow<typeof topPosts>;
export type FollowerGrowthParams = InferParams<typeof followerGrowth>;
export type FollowerGrowthRow = InferOutputRow<typeof followerGrowth>;

export const notraAdoption = defineEndpoint("notra_adoption", {
  description: "When the organization first published through Notra",
  params: {
    organization_id: p.string().describe("Organization id"),
  },
  nodes: [
    node({
      name: "adoption",
      sql: `
        SELECT
          min(captured_at) AS first_notra_post_at,
          count() AS notra_posts
        FROM social_post_sources
        WHERE organization_id = {{String(organization_id)}}
          AND source = 'notra'
      `,
    }),
  ],
  output: {
    first_notra_post_at: t.dateTime().nullable(),
    notra_posts: t.uint64(),
  },
});

export const geoOverview = defineEndpoint("geo_overview", {
  description: "AI mention rate per engine over the trailing window",
  params: {
    organization_id: p.string().describe("Organization id"),
    days: p.int32().optional(30).describe("Number of trailing days"),
  },
  nodes: [
    node({
      name: "per_engine",
      sql: `
        SELECT
          engine,
          count() AS checks,
          countIf(mentioned) AS mentions,
          round(countIf(mentioned) / count(), 3) AS mention_rate,
          round(avgIf(position, mentioned AND position IS NOT NULL), 1) AS avg_position,
          max(captured_at) AS last_checked_at
        FROM geo_mention_checks
        WHERE organization_id = {{String(organization_id)}}
          AND captured_at >= now() - toIntervalDay({{Int32(days, 30)}})
        GROUP BY engine
        ORDER BY mention_rate DESC
      `,
    }),
  ],
  output: {
    engine: t.string(),
    checks: t.uint64(),
    mentions: t.uint64(),
    mention_rate: t.float64(),
    avg_position: t.float64().nullable(),
    last_checked_at: t.dateTime(),
  },
});

export const geoTimeseries = defineEndpoint("geo_timeseries", {
  description: "Daily AI mention rate per engine",
  params: {
    organization_id: p.string().describe("Organization id"),
    days: p.int32().optional(30).describe("Number of trailing days"),
  },
  nodes: [
    node({
      name: "daily",
      sql: `
        SELECT
          toDate(captured_at) AS day,
          engine,
          count() AS checks,
          countIf(mentioned) AS mentions
        FROM geo_mention_checks
        WHERE organization_id = {{String(organization_id)}}
          AND captured_at >= now() - toIntervalDay({{Int32(days, 30)}})
        GROUP BY day, engine
        ORDER BY day ASC
      `,
    }),
  ],
  output: {
    day: t.date(),
    engine: t.string(),
    checks: t.uint64(),
    mentions: t.uint64(),
  },
});

export const geoPromptResults = defineEndpoint("geo_prompt_results", {
  description: "Latest result per prompt and engine",
  params: {
    organization_id: p.string().describe("Organization id"),
  },
  nodes: [
    node({
      name: "latest",
      sql: `
        SELECT
          prompt_id,
          engine,
          argMax(prompt, captured_at) AS prompt,
          argMax(mentioned, captured_at) AS mentioned,
          argMax(position, captured_at) AS position,
          argMax(sentiment, captured_at) AS sentiment,
          argMax(excerpt, captured_at) AS excerpt,
          max(captured_at) AS last_checked_at
        FROM geo_mention_checks
        WHERE organization_id = {{String(organization_id)}}
        GROUP BY prompt_id, engine
        ORDER BY prompt_id ASC, engine ASC
      `,
    }),
  ],
  output: {
    prompt_id: t.string(),
    engine: t.string(),
    prompt: t.string(),
    mentioned: t.bool(),
    position: t.uint64().nullable(),
    sentiment: t.string().nullable(),
    excerpt: t.string(),
    last_checked_at: t.dateTime(),
  },
});

export const geoCompetitorShare = defineEndpoint("geo_competitor_share", {
  description: "Competitor brands surfaced by AI engines, by mention count",
  params: {
    organization_id: p.string().describe("Organization id"),
    days: p.int32().optional(30).describe("Number of trailing days"),
    limit: p.int32().optional(10).describe("Max competitors"),
  },
  nodes: [
    node({
      name: "share",
      sql: `
        SELECT
          arrayJoin(competitors) AS brand,
          count() AS mentions
        FROM geo_mention_checks
        WHERE organization_id = {{String(organization_id)}}
          AND captured_at >= now() - toIntervalDay({{Int32(days, 30)}})
        GROUP BY brand
        ORDER BY mentions DESC
        LIMIT {{Int32(limit, 10)}}
      `,
    }),
  ],
  output: {
    brand: t.string(),
    mentions: t.uint64(),
  },
});

export const modelUsageLatest = defineEndpoint("model_usage_latest", {
  description:
    "Most recent industry-wide usage share snapshot per model, ranked by share",
  params: {
    source: p.string().optional("openrouter").describe("Snapshot source"),
    limit: p.int32().optional(15).describe("Max models"),
  },
  nodes: [
    node({
      name: "latest_capture",
      sql: `
        SELECT max(captured_at) AS latest_captured_at
        FROM model_usage_share
        WHERE source = {{String(source, 'openrouter')}}
      `,
    }),
    node({
      name: "latest_models",
      sql: `
        SELECT
          model,
          any(captured_at) AS captured_value,
          any(rank) AS rank_value,
          any(share) AS share_value,
          any(raw_tokens) AS tokens_value
        FROM model_usage_share
        WHERE source = {{String(source, 'openrouter')}}
          AND captured_at = (SELECT latest_captured_at FROM latest_capture)
        GROUP BY model
      `,
    }),
    node({
      name: "ranked_models",
      sql: `
        SELECT
          model,
          captured_value AS captured_at,
          rank_value AS rank,
          share_value AS share,
          tokens_value AS raw_tokens
        FROM latest_models
        ORDER BY share DESC, model ASC
        LIMIT {{Int32(limit, 15)}}
      `,
    }),
  ],
  output: {
    model: t.string(),
    captured_at: t.dateTime(),
    rank: t.uint64(),
    share: t.float64(),
    raw_tokens: t.uint64().nullable(),
  },
});

export const modelUsageTrend = defineEndpoint("model_usage_trend", {
  description: "Weekly usage share per model over the trailing window",
  params: {
    source: p.string().optional("openrouter").describe("Snapshot source"),
    weeks: p.int32().optional(8).describe("Number of trailing weeks"),
  },
  nodes: [
    node({
      name: "weekly_share",
      sql: `
        SELECT
          toMonday(captured_at) AS week,
          model,
          avg(share) AS avg_share,
          max(raw_tokens) AS peak_tokens
        FROM model_usage_share
        WHERE source = {{String(source, 'openrouter')}}
          AND captured_at >= toMonday(now()) - toIntervalWeek({{Int32(weeks, 8)}})
        GROUP BY week, model
        ORDER BY week ASC, avg_share DESC
      `,
    }),
  ],
  output: {
    week: t.date(),
    model: t.string(),
    avg_share: t.float64(),
    peak_tokens: t.uint64().nullable(),
  },
});

export type ModelUsageLatestParams = InferParams<typeof modelUsageLatest>;
export type ModelUsageLatestRow = InferOutputRow<typeof modelUsageLatest>;
export type ModelUsageTrendParams = InferParams<typeof modelUsageTrend>;
export type ModelUsageTrendRow = InferOutputRow<typeof modelUsageTrend>;

export type NotraAdoptionRow = InferOutputRow<typeof notraAdoption>;
export type GeoOverviewRow = InferOutputRow<typeof geoOverview>;
export type GeoTimeseriesRow = InferOutputRow<typeof geoTimeseries>;
export type GeoPromptResultsRow = InferOutputRow<typeof geoPromptResults>;
export type GeoCompetitorShareRow = InferOutputRow<typeof geoCompetitorShare>;

export const postMetricsLookup = defineEndpoint("post_metrics_lookup", {
  description: "Latest metric snapshot for specific posts by platform post id",
  params: {
    organization_id: p.string().describe("Organization id"),
    post_ids: p.array(p.string()).describe("Platform post ids"),
  },
  nodes: [
    node({
      name: "stats_lookup",
      sql: `
        SELECT
          provider,
          platform_post_id,
          argMaxMerge(impressions_state) AS impressions,
          argMaxMerge(likes_state) AS likes,
          argMaxMerge(replies_state) AS replies,
          argMaxMerge(reposts_state) AS reposts,
          argMaxMerge(bookmarks_state) AS bookmarks,
          maxMerge(last_captured_at_state) AS last_captured_at
        FROM social_post_stats_latest
        WHERE organization_id = {{String(organization_id)}}
          AND platform_post_id IN {{Array(post_ids, 'String')}}
        GROUP BY provider, platform_post_id
      `,
    }),
    node({
      name: "lookup",
      sql: `
        SELECT
          posts.provider AS provider,
          posts.platform_post_id AS platform_post_id,
          argMax(posts.content, posts.captured_at) AS content,
          argMax(posts.url, posts.captured_at) AS url,
          min(posts.posted_at) AS first_posted_at,
          any(stats.impressions) AS impressions,
          any(stats.likes) AS likes,
          any(stats.replies) AS replies,
          any(stats.reposts) AS reposts,
          any(stats.bookmarks) AS bookmarks,
          any(stats.last_captured_at) AS last_captured_at
        FROM social_posts AS posts
        LEFT JOIN stats_lookup AS stats
          ON stats.provider = posts.provider
          AND stats.platform_post_id = posts.platform_post_id
        WHERE posts.organization_id = {{String(organization_id)}}
          AND posts.platform_post_id IN {{Array(post_ids, 'String')}}
        GROUP BY posts.provider, posts.platform_post_id
      `,
    }),
  ],
  output: {
    provider: t.string(),
    platform_post_id: t.string(),
    content: t.string(),
    url: t.string().nullable(),
    first_posted_at: t.dateTime(),
    impressions: t.uint64().nullable(),
    likes: t.uint64().nullable(),
    replies: t.uint64().nullable(),
    reposts: t.uint64().nullable(),
    bookmarks: t.uint64().nullable(),
    last_captured_at: t.dateTime().nullable(),
  },
});

export type PostMetricsLookupRow = InferOutputRow<typeof postMetricsLookup>;
