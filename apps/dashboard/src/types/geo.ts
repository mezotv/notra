export interface GeoSettings {
  id: string;
  organizationId: string;
  companyName: string;
  aliases: string[];
  competitors: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeoSettingsResponse {
  configured: boolean;
  settings: GeoSettings | null;
}

export interface GeoOverviewEngine {
  engine: string;
  checks: number;
  mentions: number;
  mentionRate: number;
  avgPosition: number | null;
  lastCheckedAt: string;
}

export interface GeoOverviewResponse {
  configured: boolean;
  engines: GeoOverviewEngine[];
}

export interface GeoTimeseriesPoint {
  day: string;
  engine: string;
  checks: number;
  mentions: number;
}

export interface GeoTimeseriesResponse {
  configured: boolean;
  points: GeoTimeseriesPoint[];
}

export interface GeoPromptResult {
  promptId: string;
  engine: string;
  prompt: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  excerpt: string;
  lastCheckedAt: string;
}

export interface GeoPromptResultsResponse {
  configured: boolean;
  results: GeoPromptResult[];
}

export interface GeoCompetitorSharePoint {
  brand: string;
  mentions: number;
}

export interface GeoCompetitorShareResponse {
  configured: boolean;
  points: GeoCompetitorSharePoint[];
}

export interface GeoSettingsUpsertInput {
  organizationId: string;
  companyName: string;
  aliases: string[];
  competitors: string[];
  enabled: boolean;
}

export interface GeoTrackedPrompt {
  id: string;
  prompt: string;
  enabled: boolean;
  source: "custom" | "auto";
  createdAt: string | null;
}

export interface GeoPromptCreateInput {
  prompt: string;
}

export interface GeoPromptDeleteInput {
  promptId: string;
}

export interface GeoPromptToggleInput {
  promptId: string;
  enabled: boolean;
}

export interface GeoPromptRow {
  id: string;
  organizationId: string;
  prompt: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoTrackedPromptsResponse {
  configured: boolean;
  prompts: GeoTrackedPrompt[];
}

export interface GeoScanPayload {
  organizationId: string;
}

export interface GeoScanResult {
  status: "completed" | "skipped" | "invalid_payload";
  checks?: number;
  mentions?: number;
}

export interface GeoPromptDefinition {
  id: string;
  text: string;
}

export interface GeoBrandContext {
  companyDescription: string | null;
  audience: string | null;
}

export interface MentionRateRow {
  day: string;
  rawDay: string;
  [engine: string]: string | number;
}

export type GeoGroundedProvider =
  | "gateway-openai"
  | "gateway-anthropic"
  | "gateway-google"
  | "direct-openai"
  | "direct-anthropic"
  | "direct-perplexity";

export interface GeoGroundedEngine {
  key: string;
  label: string;
  model: string;
  provider: GeoGroundedProvider;
  envVar: string | null;
  isAvailable: () => boolean;
}

export interface GeoWebsiteDiscovery {
  companyName: string;
  aliases: string[];
  competitors: string[];
  prompts: string[];
}

export interface GeoGenerateFromWebsiteResult {
  companyName: string;
  aliases: string[];
  competitors: string[];
  promptsAdded: number;
}

export interface GeoGenerateFromWebsiteInput {
  url: string;
}

export interface GeoModelUsageRow {
  model: string;
  label: string;
  rank: number;
  share: number;
  rawTokens: number | null;
  scanned: boolean;
  mentionRate: number | null;
  checks: number;
}

export interface GeoModelUsageResponse {
  configured: boolean;
  source: string;
  attribution: string;
  capturedAt: string | null;
  models: GeoModelUsageRow[];
}

export interface GeoModelUsageInput {
  days?: number;
  limit?: number;
}

export interface GeoModelUsageSnapshot {
  status: "captured" | "skipped";
  models?: number;
  capturedAt?: string;
}

export interface GeoJudgeResult {
  mentioned: boolean;
  position: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  competitors: string[];
  excerpt: string;
}
