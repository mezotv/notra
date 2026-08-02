import { defineDatasource, engine, type InferRow, t } from "@tinybirdco/sdk";

export const socialAccounts = defineDatasource("social_accounts", {
  description:
    "Connected social account dimension snapshots for Twitter/X and LinkedIn",
  schema: {
    organization_id: t.string(),
    account_id: t.string(),
    provider: t.string().lowCardinality(),
    provider_account_id: t.string(),
    username: t.string(),
    display_name: t.string().nullable(),
    profile_image_url: t.string().nullable(),
    profile_url: t.string().nullable(),
    account_type: t.string().nullable(),
    verified: t.bool(),
    captured_at: t.dateTime(),
  },
  engine: engine.replacingMergeTree({
    sortingKey: ["organization_id", "provider", "provider_account_id"],
    ver: "captured_at",
  }),
});

export const socialAccountStats = defineDatasource("social_account_stats", {
  description:
    "Append-only account-level stat snapshots; metrics a platform does not expose are null",
  schema: {
    organization_id: t.string(),
    account_id: t.string(),
    provider: t.string().lowCardinality(),
    provider_account_id: t.string(),
    captured_at: t.dateTime(),
    followers_count: t.uint64().nullable(),
    following_count: t.uint64().nullable(),
    posts_count: t.uint64().nullable(),
    listed_count: t.uint64().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: [
      "organization_id",
      "provider",
      "provider_account_id",
      "captured_at",
    ],
    partitionKey: "toYYYYMM(captured_at)",
  }),
});

export const socialPosts = defineDatasource("social_posts", {
  description:
    "Published post dimension rows for Twitter/X and LinkedIn, keyed by platform post id",
  schema: {
    organization_id: t.string(),
    account_id: t.string(),
    provider: t.string().lowCardinality(),
    provider_account_id: t.string(),
    platform_post_id: t.string(),
    url: t.string().nullable(),
    content: t.string(),
    posted_at: t.dateTime(),
    captured_at: t.dateTime(),
  },
  engine: engine.replacingMergeTree({
    sortingKey: ["organization_id", "provider", "platform_post_id"],
    ver: "captured_at",
  }),
});

export const socialPostStats = defineDatasource("social_post_stats", {
  description:
    "Append-only post-level stat snapshots; metrics a platform does not expose are null",
  schema: {
    organization_id: t.string(),
    provider: t.string().lowCardinality(),
    provider_account_id: t.string(),
    platform_post_id: t.string(),
    captured_at: t.dateTime(),
    impressions: t.uint64().nullable(),
    likes: t.uint64().nullable(),
    replies: t.uint64().nullable(),
    reposts: t.uint64().nullable(),
    quotes: t.uint64().nullable(),
    bookmarks: t.uint64().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: [
      "organization_id",
      "provider",
      "platform_post_id",
      "captured_at",
    ],
    partitionKey: "toYYYYMM(captured_at)",
  }),
});

export const socialPostStatsLatest = defineDatasource(
  "social_post_stats_latest",
  {
    description:
      "Materialized latest-per-post metric states; read with argMaxMerge/maxMerge instead of scanning social_post_stats",
    schema: {
      organization_id: t.string(),
      provider: t.string().lowCardinality(),
      provider_account_id: t.string(),
      platform_post_id: t.string(),
      impressions_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      likes_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      replies_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      reposts_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      quotes_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      bookmarks_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      last_captured_at_state: t.aggregateFunction("max", t.dateTime()),
    },
    engine: engine.aggregatingMergeTree({
      sortingKey: [
        "organization_id",
        "provider",
        "platform_post_id",
        "provider_account_id",
      ],
    }),
  }
);

export const socialAccountStatsLatest = defineDatasource(
  "social_account_stats_latest",
  {
    description:
      "Materialized latest-per-account stat states; read with argMaxMerge/maxMerge instead of scanning social_account_stats",
    schema: {
      organization_id: t.string(),
      provider: t.string().lowCardinality(),
      provider_account_id: t.string(),
      account_id_state: t.aggregateFunction("argMax", t.string(), t.dateTime()),
      followers_count_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      following_count_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      posts_count_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      listed_count_state: t.aggregateFunction(
        "argMax",
        t.uint64().nullable(),
        t.dateTime()
      ),
      last_captured_at_state: t.aggregateFunction("max", t.dateTime()),
    },
    engine: engine.aggregatingMergeTree({
      sortingKey: ["organization_id", "provider", "provider_account_id"],
    }),
  }
);

export const socialPostSources = defineDatasource("social_post_sources", {
  description:
    "Append-only ledger marking posts that were published through Notra",
  schema: {
    organization_id: t.string(),
    provider: t.string().lowCardinality(),
    provider_account_id: t.string(),
    platform_post_id: t.string(),
    source: t.string().lowCardinality(),
    captured_at: t.dateTime(),
  },
  engine: engine.mergeTree({
    sortingKey: ["organization_id", "provider", "platform_post_id"],
  }),
});

export const geoMentionChecks = defineDatasource("geo_mention_checks", {
  description:
    "AI engine mention checks: one row per prompt x engine per scan, with extracted mention data",
  schema: {
    organization_id: t.string(),
    scan_id: t.string(),
    engine: t.string().lowCardinality(),
    prompt_id: t.string().lowCardinality(),
    prompt: t.string(),
    captured_at: t.dateTime(),
    mentioned: t.bool(),
    position: t.uint64().nullable(),
    sentiment: t.string().lowCardinality().nullable(),
    competitors: t.array(t.string()).jsonPath("$.competitors[:]"),
    excerpt: t.string(),
  },
  engine: engine.mergeTree({
    sortingKey: ["organization_id", "engine", "prompt_id", "captured_at"],
    partitionKey: "toYYYYMM(captured_at)",
  }),
});

export const modelUsageShare = defineDatasource("model_usage_share", {
  description:
    "Industry-wide AI model usage snapshots. Intentionally has no organization_id: model usage share is global market data, identical for every organization",
  schema: {
    captured_at: t.dateTime(),
    source: t.string().lowCardinality(),
    model: t.string(),
    rank: t.uint64(),
    share: t.float64(),
    raw_tokens: t.uint64().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: ["source", "captured_at", "model"],
    partitionKey: "toYYYYMM(captured_at)",
  }),
});

export type SocialAccountRow = InferRow<typeof socialAccounts>;
export type SocialAccountStatsRow = InferRow<typeof socialAccountStats>;
export type SocialPostRow = InferRow<typeof socialPosts>;
export type SocialPostStatsRow = InferRow<typeof socialPostStats>;
export type SocialPostSourceRow = InferRow<typeof socialPostSources>;
export type GeoMentionCheckRow = InferRow<typeof geoMentionChecks>;
export type ModelUsageShareRow = InferRow<typeof modelUsageShare>;
