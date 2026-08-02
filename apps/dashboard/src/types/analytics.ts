import type { ChartConfig } from "@notra/ui/components/dither-kit/chart-context";

export interface SocialAnalyticsSyncPayload {
  organizationId?: string;
}

export interface SocialAnalyticsSyncResult {
  status: "completed" | "skipped" | "invalid_payload";
  syncedAccounts?: number;
  syncedPosts?: number;
}

export interface SyncableSocialAccount {
  id: string;
  organizationId: string;
  provider: string;
  providerAccountId: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  verified: boolean;
}

export interface TwitterPublicMetrics {
  followers_count?: number;
  following_count?: number;
  tweet_count?: number;
  listed_count?: number;
}

export interface TwitterTweetPublicMetrics {
  retweet_count?: number;
  reply_count?: number;
  like_count?: number;
  quote_count?: number;
  bookmark_count?: number;
  impression_count?: number;
}

export interface TwitterBatchUser {
  id: string;
  username: string;
  name?: string;
  verified?: boolean;
  verified_type?: string;
  profile_image_url?: string;
  public_metrics?: TwitterPublicMetrics;
}

export interface TwitterBatchUsersResponse {
  data?: TwitterBatchUser[];
}

export interface TwitterUserByUsernameResponse {
  data?: TwitterBatchUser;
}

export interface ResolvedTwitterAccount {
  providerAccountId: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  verified: boolean;
  verifiedType: string | null;
  followersCount: number | null;
}

export interface TwitterTimelineTweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: TwitterTweetPublicMetrics;
}

export interface TwitterTimelineResponse {
  data?: TwitterTimelineTweet[];
  meta?: {
    next_token?: string;
  };
}

export interface RecordPublishedSocialPostInput {
  organizationId: string;
  accountId: string;
  provider: string;
  providerAccountId: string;
  platformPostId: string;
  url: string | null;
  content: string;
}

export interface SocialOverviewAccount {
  provider: string;
  providerAccountId: string;
  accountId: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  verified: boolean;
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  trackedPosts: number | null;
  impressions: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  quotes: number | null;
  bookmarks: number | null;
  statsCapturedAt: string | null;
}

export interface SocialOverviewResponse {
  configured: boolean;
  accounts: SocialOverviewAccount[];
}

export interface EngagementTimeseriesPoint {
  day: string;
  provider: string;
  providerAccountId: string;
  posts: number;
  impressions: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
}

export interface EngagementTimeseriesResponse {
  configured: boolean;
  points: EngagementTimeseriesPoint[];
}

export interface TopPostItem {
  provider: string;
  platformPostId: string;
  providerAccountId: string;
  username: string | null;
  profileImageUrl: string | null;
  content: string;
  url: string | null;
  postedAt: string;
  impressions: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  bookmarks: number | null;
  engagement: number;
}

export interface TopPostsResponse {
  configured: boolean;
  posts: TopPostItem[];
}

export interface FollowerGrowthPoint {
  day: string;
  provider: string;
  providerAccountId: string;
  followersCount: number | null;
}

export interface FollowerGrowthResponse {
  configured: boolean;
  points: FollowerGrowthPoint[];
}

export interface FollowerChartRow {
  day: string;
  [accountKey: string]: string | number;
}

export interface AnalyticsStatCard {
  label: string;
  value: number | null;
  hint?: string;
}

export interface PostingPerformancePoint {
  weekday: number;
  posts: number;
  engagement: number;
  impressions: number | null;
  avgEngagement: number;
}

export interface PostingPerformanceResponse {
  configured: boolean;
  points: PostingPerformancePoint[];
}

export interface PostingPerformanceChartRow {
  day: string;
  avgEngagement: number;
  posts: number;
}

export interface AccountSeriesRow {
  day: string;
  rawDay: string;
  [accountKey: string]: string | number;
}

export interface NotraAdoptionResponse {
  configured: boolean;
  organizationCreatedAt: string | null;
  firstNotraPostAt: string | null;
  notraPosts: number;
}

export type LeaderboardWindow = 7 | 30;

export interface LeaderboardAccount {
  provider: string;
  providerAccountId: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  verified: boolean;
  verifiedType: string | null;
  isConnected: boolean;
  trackedAccountId: string | null;
}

export interface LeaderboardWindowTotals {
  provider: string;
  providerAccountId: string;
  posts: number;
  interactions: number;
  impressions: number;
  previousPosts: number;
  previousInteractions: number;
  previousImpressions: number;
}

export interface LeaderboardEntry {
  key: string;
  provider: string;
  providerAccountId: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  verified: boolean;
  verifiedType: string | null;
  isConnected: boolean;
  trackedAccountId: string | null;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  interactions: number;
  impressions: number | null;
  posts: number;
}

export interface LeaderboardResponse {
  configured: boolean;
  days: LeaderboardWindow;
  entries: LeaderboardEntry[];
}

export interface TimelineMarker {
  index: number | null;
  label: string;
}

export interface TrackAccountPreviewResponse {
  account: ResolvedTwitterAccount | null;
}

export interface AnalyticsHeroSummary {
  followers: number | null;
  impressions: number;
  interactions: number;
  posts: number;
  engagementRate: number | null;
}

export interface SummaryStatsProps {
  accounts: SocialOverviewAccount[];
  points: EngagementTimeseriesPoint[];
}

export interface AnalyticsStatTile {
  label: string;
  value: string;
  hint: string;
  accent: boolean;
}

export interface AccountSeriesChartCardProps {
  hero?: boolean;
  title: string;
  readout: string;
  kind: "area" | "line" | "bar";
  rows: AccountSeriesRow[];
  config: ChartConfig;
  allKeys: string[];
  hiddenKeys: ReadonlySet<string>;
  onToggleSeries: (key: string) => void;
  hoverIndex: number | null;
  onHoverChange: (index: number | null) => void;
  markers: TimelineMarker[];
  emptyMessage: string;
}
