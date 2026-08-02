import { type IngestResult, type QueryResult, Tinybird } from "@tinybirdco/sdk";
import { bumpAnalyticsVersions, cachedQuery } from "../cache/query-cache";
import type { AnalyticsCacheScope } from "../types/cache";
import {
  type AiTrafficEventRow,
  aiTrafficEvents,
  type GeoMentionCheckRow,
  geoMentionChecks,
  type ModelUsageShareRow,
  modelUsageShare,
  type SocialAccountRow,
  type SocialAccountStatsRow,
  type SocialPostRow,
  type SocialPostSourceRow,
  type SocialPostStatsRow,
  socialAccountStats,
  socialAccounts,
  socialPostSources,
  socialPostStats,
  socialPosts,
} from "./datasources";
import {
  type AccountLeaderboardParams,
  type AccountLeaderboardRow,
  type AiTrafficLogRow,
  type AiTrafficOverviewRow,
  type AiTrafficTimeseriesRow,
  accountLeaderboard,
  aiTrafficLog,
  aiTrafficOverview,
  aiTrafficTimeseries,
  type EngagementTimeseriesParams,
  type EngagementTimeseriesRow,
  engagementTimeseries,
  type FollowerGrowthParams,
  type FollowerGrowthRow,
  followerGrowth,
  type GeoCompetitorShareRow,
  type GeoOverviewRow,
  type GeoPromptResultsRow,
  type GeoTimeseriesRow,
  geoCompetitorShare,
  geoOverview,
  geoPromptResults,
  geoTimeseries,
  type ModelUsageLatestParams,
  type ModelUsageLatestRow,
  type ModelUsageTrendParams,
  type ModelUsageTrendRow,
  modelUsageLatest,
  modelUsageTrend,
  type NotraAdoptionRow,
  notraAdoption,
  type PostingPerformanceParams,
  type PostingPerformanceRow,
  type PostMetricsLookupRow,
  postingPerformance,
  postMetricsLookup,
  type SocialOverviewParams,
  type SocialOverviewRow,
  socialOverview,
  type TopPostsParams,
  type TopPostsRow,
  topPosts,
} from "./endpoints";

export function isTinybirdConfigured(): boolean {
  return Boolean(process.env.TINYBIRD_TOKEN);
}

function createTinybirdClient() {
  return new Tinybird({
    token: process.env.TINYBIRD_TOKEN,
    baseUrl: process.env.TINYBIRD_BASE_URL ?? "https://api.tinybird.co",
    devMode: false,
    datasources: {
      socialAccounts,
      socialAccountStats,
      socialPosts,
      socialPostStats,
      socialPostSources,
      geoMentionChecks,
      modelUsageShare,
      aiTrafficEvents,
    },
    pipes: {
      socialOverview,
      engagementTimeseries,
      topPosts,
      followerGrowth,
      postingPerformance,
      notraAdoption,
      postMetricsLookup,
      geoOverview,
      geoTimeseries,
      geoPromptResults,
      geoCompetitorShare,
      accountLeaderboard,
      modelUsageLatest,
      modelUsageTrend,
      aiTrafficOverview,
      aiTrafficTimeseries,
      aiTrafficLog,
    },
  });
}

let cachedClient: ReturnType<typeof createTinybirdClient> | null = null;

function getTinybirdClient() {
  if (!isTinybirdConfigured()) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createTinybirdClient();
  }
  return cachedClient;
}

async function ingestRows<TRow>(
  rows: TRow[],
  scope: AnalyticsCacheScope,
  organizationIds: ReadonlyArray<string | null>,
  ingest: (
    client: NonNullable<ReturnType<typeof getTinybirdClient>>,
    batch: TRow[]
  ) => Promise<IngestResult>
): Promise<IngestResult | null> {
  const client = getTinybirdClient();
  if (!client || rows.length === 0) {
    return null;
  }
  const result = await ingest(client, rows);
  await bumpAnalyticsVersions(scope, organizationIds);
  return result;
}

function cachedPipeQuery<TParams extends Record<string, unknown>, TRow>(
  scope: AnalyticsCacheScope,
  pipe: string,
  params: TParams,
  organizationId: string | null,
  query: (
    client: NonNullable<ReturnType<typeof getTinybirdClient>>
  ) => Promise<QueryResult<TRow>>
): Promise<QueryResult<TRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return Promise.resolve(null);
  }
  return cachedQuery({
    scope,
    pipe,
    organizationId,
    params,
    fetch: () => query(client),
  });
}

export function ingestSocialAccounts(
  rows: SocialAccountRow[]
): Promise<IngestResult | null> {
  return ingestRows(
    rows,
    "social",
    rows.map((row) => row.organization_id),
    (client, batch) => client.socialAccounts.ingestBatch(batch)
  );
}

export function ingestSocialAccountStats(
  rows: SocialAccountStatsRow[]
): Promise<IngestResult | null> {
  return ingestRows(
    rows,
    "social",
    rows.map((row) => row.organization_id),
    (client, batch) => client.socialAccountStats.ingestBatch(batch)
  );
}

export function ingestSocialPosts(
  rows: SocialPostRow[]
): Promise<IngestResult | null> {
  return ingestRows(
    rows,
    "social",
    rows.map((row) => row.organization_id),
    (client, batch) => client.socialPosts.ingestBatch(batch)
  );
}

export function ingestSocialPostStats(
  rows: SocialPostStatsRow[]
): Promise<IngestResult | null> {
  return ingestRows(
    rows,
    "social",
    rows.map((row) => row.organization_id),
    (client, batch) => client.socialPostStats.ingestBatch(batch)
  );
}

export function ingestSocialPostSources(
  rows: SocialPostSourceRow[]
): Promise<IngestResult | null> {
  return ingestRows(
    rows,
    "social",
    rows.map((row) => row.organization_id),
    (client, batch) => client.socialPostSources.ingestBatch(batch)
  );
}

export function ingestGeoMentionChecks(
  rows: GeoMentionCheckRow[]
): Promise<IngestResult | null> {
  return ingestRows(
    rows,
    "geo",
    rows.map((row) => row.organization_id),
    (client, batch) => client.geoMentionChecks.ingestBatch(batch)
  );
}

export function ingestModelUsageShare(
  rows: ModelUsageShareRow[]
): Promise<IngestResult | null> {
  return ingestRows(rows, "model", [null], (client, batch) =>
    client.modelUsageShare.ingestBatch(batch)
  );
}

export function ingestAiTrafficEvents(
  rows: AiTrafficEventRow[]
): Promise<IngestResult | null> {
  return ingestRows(
    rows,
    "traffic",
    rows.map((row) => row.organization_id),
    (client, batch) => client.aiTrafficEvents.ingestBatch(batch)
  );
}

export function querySocialOverview(
  params: SocialOverviewParams
): Promise<QueryResult<SocialOverviewRow> | null> {
  return cachedPipeQuery(
    "social",
    "social_overview",
    params,
    params.organization_id,
    (client) => client.socialOverview.query(params)
  );
}

export function queryEngagementTimeseries(
  params: EngagementTimeseriesParams
): Promise<QueryResult<EngagementTimeseriesRow> | null> {
  return cachedPipeQuery(
    "social",
    "engagement_timeseries",
    params,
    params.organization_id,
    (client) => client.engagementTimeseries.query(params)
  );
}

export function queryTopPosts(
  params: TopPostsParams
): Promise<QueryResult<TopPostsRow> | null> {
  return cachedPipeQuery(
    "social",
    "top_posts",
    params,
    params.organization_id,
    (client) => client.topPosts.query(params)
  );
}

export function queryFollowerGrowth(
  params: FollowerGrowthParams
): Promise<QueryResult<FollowerGrowthRow> | null> {
  return cachedPipeQuery(
    "social",
    "follower_growth",
    params,
    params.organization_id,
    (client) => client.followerGrowth.query(params)
  );
}

export function queryPostingPerformance(
  params: PostingPerformanceParams
): Promise<QueryResult<PostingPerformanceRow> | null> {
  return cachedPipeQuery(
    "social",
    "posting_performance",
    params,
    params.organization_id,
    (client) => client.postingPerformance.query(params)
  );
}

export function queryNotraAdoption(params: {
  organization_id: string;
}): Promise<QueryResult<NotraAdoptionRow> | null> {
  return cachedPipeQuery(
    "social",
    "notra_adoption",
    params,
    params.organization_id,
    (client) => client.notraAdoption.query(params)
  );
}

export function queryGeoOverview(params: {
  organization_id: string;
  days?: number;
}): Promise<QueryResult<GeoOverviewRow> | null> {
  return cachedPipeQuery(
    "geo",
    "geo_overview",
    params,
    params.organization_id,
    (client) => client.geoOverview.query(params)
  );
}

export function queryGeoTimeseries(params: {
  organization_id: string;
  days?: number;
}): Promise<QueryResult<GeoTimeseriesRow> | null> {
  return cachedPipeQuery(
    "geo",
    "geo_timeseries",
    params,
    params.organization_id,
    (client) => client.geoTimeseries.query(params)
  );
}

export function queryGeoPromptResults(params: {
  organization_id: string;
}): Promise<QueryResult<GeoPromptResultsRow> | null> {
  return cachedPipeQuery(
    "geo",
    "geo_prompt_results",
    params,
    params.organization_id,
    (client) => client.geoPromptResults.query(params)
  );
}

export function queryGeoCompetitorShare(params: {
  organization_id: string;
  days?: number;
  limit?: number;
}): Promise<QueryResult<GeoCompetitorShareRow> | null> {
  return cachedPipeQuery(
    "geo",
    "geo_competitor_share",
    params,
    params.organization_id,
    (client) => client.geoCompetitorShare.query(params)
  );
}

export function queryAccountLeaderboard(
  params: AccountLeaderboardParams
): Promise<QueryResult<AccountLeaderboardRow> | null> {
  return cachedPipeQuery(
    "social",
    "account_leaderboard",
    params,
    params.organization_id,
    (client) => client.accountLeaderboard.query(params)
  );
}

export function queryPostMetricsLookup(params: {
  organization_id: string;
  post_ids: string[];
}): Promise<QueryResult<PostMetricsLookupRow> | null> {
  return cachedPipeQuery(
    "social",
    "post_metrics_lookup",
    params,
    params.organization_id,
    (client) =>
      // The SDK serializes arrays as repeated query keys (post_ids=a&post_ids=b),
      // but Tinybird's Array() template reads a single comma-separated value, so
      // repeated keys silently collapse to one id. Send one pre-joined value.
      client.postMetricsLookup.query({
        organization_id: params.organization_id,
        post_ids: [params.post_ids.join(",")],
      })
  );
}

export function queryModelUsageLatest(
  params: ModelUsageLatestParams
): Promise<QueryResult<ModelUsageLatestRow> | null> {
  return cachedPipeQuery(
    "model",
    "model_usage_latest",
    params,
    null,
    (client) => client.modelUsageLatest.query(params)
  );
}

export function queryModelUsageTrend(
  params: ModelUsageTrendParams
): Promise<QueryResult<ModelUsageTrendRow> | null> {
  return cachedPipeQuery("model", "model_usage_trend", params, null, (client) =>
    client.modelUsageTrend.query(params)
  );
}

export function queryAiTrafficOverview(params: {
  organization_id: string;
  days?: number;
}): Promise<QueryResult<AiTrafficOverviewRow> | null> {
  return cachedPipeQuery(
    "traffic",
    "ai_traffic_overview",
    params,
    params.organization_id,
    (client) => client.aiTrafficOverview.query(params)
  );
}

export function queryAiTrafficTimeseries(params: {
  organization_id: string;
  days?: number;
}): Promise<QueryResult<AiTrafficTimeseriesRow> | null> {
  return cachedPipeQuery(
    "traffic",
    "ai_traffic_timeseries",
    params,
    params.organization_id,
    (client) => client.aiTrafficTimeseries.query(params)
  );
}

export function queryAiTrafficLog(params: {
  organization_id: string;
  limit?: number;
}): Promise<QueryResult<AiTrafficLogRow> | null> {
  return cachedPipeQuery(
    "traffic",
    "ai_traffic_log",
    params,
    params.organization_id,
    (client) => client.aiTrafficLog.query(params)
  );
}
