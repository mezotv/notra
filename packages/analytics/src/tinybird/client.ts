import { type IngestResult, type QueryResult, Tinybird } from "@tinybirdco/sdk";
import {
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
  accountLeaderboard,
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
  ingest: (
    client: NonNullable<ReturnType<typeof getTinybirdClient>>,
    batch: TRow[]
  ) => Promise<IngestResult>
): Promise<IngestResult | null> {
  const client = getTinybirdClient();
  if (!client || rows.length === 0) {
    return null;
  }
  return await ingest(client, rows);
}

export function ingestSocialAccounts(
  rows: SocialAccountRow[]
): Promise<IngestResult | null> {
  return ingestRows(rows, (client, batch) =>
    client.socialAccounts.ingestBatch(batch)
  );
}

export function ingestSocialAccountStats(
  rows: SocialAccountStatsRow[]
): Promise<IngestResult | null> {
  return ingestRows(rows, (client, batch) =>
    client.socialAccountStats.ingestBatch(batch)
  );
}

export function ingestSocialPosts(
  rows: SocialPostRow[]
): Promise<IngestResult | null> {
  return ingestRows(rows, (client, batch) =>
    client.socialPosts.ingestBatch(batch)
  );
}

export function ingestSocialPostStats(
  rows: SocialPostStatsRow[]
): Promise<IngestResult | null> {
  return ingestRows(rows, (client, batch) =>
    client.socialPostStats.ingestBatch(batch)
  );
}

export function ingestSocialPostSources(
  rows: SocialPostSourceRow[]
): Promise<IngestResult | null> {
  return ingestRows(rows, (client, batch) =>
    client.socialPostSources.ingestBatch(batch)
  );
}

export function ingestGeoMentionChecks(
  rows: GeoMentionCheckRow[]
): Promise<IngestResult | null> {
  return ingestRows(rows, (client, batch) =>
    client.geoMentionChecks.ingestBatch(batch)
  );
}

export function ingestModelUsageShare(
  rows: ModelUsageShareRow[]
): Promise<IngestResult | null> {
  return ingestRows(rows, (client, batch) =>
    client.modelUsageShare.ingestBatch(batch)
  );
}

export async function querySocialOverview(
  params: SocialOverviewParams
): Promise<QueryResult<SocialOverviewRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.socialOverview.query(params);
}

export async function queryEngagementTimeseries(
  params: EngagementTimeseriesParams
): Promise<QueryResult<EngagementTimeseriesRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.engagementTimeseries.query(params);
}

export async function queryTopPosts(
  params: TopPostsParams
): Promise<QueryResult<TopPostsRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.topPosts.query(params);
}

export async function queryFollowerGrowth(
  params: FollowerGrowthParams
): Promise<QueryResult<FollowerGrowthRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.followerGrowth.query(params);
}

export async function queryPostingPerformance(
  params: PostingPerformanceParams
): Promise<QueryResult<PostingPerformanceRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.postingPerformance.query(params);
}

export async function queryNotraAdoption(params: {
  organization_id: string;
}): Promise<QueryResult<NotraAdoptionRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.notraAdoption.query(params);
}

export async function queryGeoOverview(params: {
  organization_id: string;
  days?: number;
}): Promise<QueryResult<GeoOverviewRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.geoOverview.query(params);
}

export async function queryGeoTimeseries(params: {
  organization_id: string;
  days?: number;
}): Promise<QueryResult<GeoTimeseriesRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.geoTimeseries.query(params);
}

export async function queryGeoPromptResults(params: {
  organization_id: string;
}): Promise<QueryResult<GeoPromptResultsRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.geoPromptResults.query(params);
}

export async function queryGeoCompetitorShare(params: {
  organization_id: string;
  days?: number;
  limit?: number;
}): Promise<QueryResult<GeoCompetitorShareRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.geoCompetitorShare.query(params);
}

export async function queryAccountLeaderboard(
  params: AccountLeaderboardParams
): Promise<QueryResult<AccountLeaderboardRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.accountLeaderboard.query(params);
}

export async function queryPostMetricsLookup(params: {
  organization_id: string;
  post_ids: string[];
}): Promise<QueryResult<PostMetricsLookupRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.postMetricsLookup.query(params);
}

export async function queryModelUsageLatest(
  params: ModelUsageLatestParams
): Promise<QueryResult<ModelUsageLatestRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.modelUsageLatest.query(params);
}

export async function queryModelUsageTrend(
  params: ModelUsageTrendParams
): Promise<QueryResult<ModelUsageTrendRow> | null> {
  const client = getTinybirdClient();
  if (!client) {
    return null;
  }
  return await client.modelUsageTrend.query(params);
}
