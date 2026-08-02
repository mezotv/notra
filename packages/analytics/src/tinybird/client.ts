import { type IngestResult, type QueryResult, Tinybird } from "@tinybirdco/sdk";
import {
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
    },
    pipes: {
      socialOverview,
      engagementTimeseries,
      topPosts,
      followerGrowth,
      postingPerformance,
      notraAdoption,
      postMetricsLookup,
      accountLeaderboard,
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
  return await client.postMetricsLookup.query({
    organization_id: params.organization_id,
    post_ids: [params.post_ids.join(",")],
  });
}
