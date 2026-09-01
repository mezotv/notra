import type { AgentTokenUsage } from "@notra/ai/types/agents";
import type { GeoLogEventName } from "@notra/ai/types/evlog";
import type {
  GeoContentBrief,
  GeoContentSubtype,
} from "@notra/ai/types/geo-writer";
import type {
  GeoCheckGrounding,
  GeoCheckSourceItem,
  GeoCheckWrite,
} from "@notra/db/types/geo-checks";
import type { GeoContentBriefStatus } from "@notra/db/types/geo-writer";
import type {
  FinishReason,
  LanguageModel,
  LanguageModelUsage,
  ToolSet,
} from "ai";

export interface GeoProject {
  id: string;
  name: string;
  brandSettingsId: string;
  createdAt: string;
}

export interface GeoProjectRow {
  id: string;
  organizationId: string;
  name: string;
  brandSettingsId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoProjectsResponse {
  projects: GeoProject[];
}

export interface GeoProjectScope {
  organizationId: string;
  projectId: string | null;
  brandSettingsId: string | null;
  includeUnassigned: boolean;
}

export interface GeoScopeInput {
  organizationId: string;
  projectId?: string;
}

export interface GeoProjectUpdateInput {
  name?: string;
  brandSettingsId?: string;
}

export interface GeoSettings {
  id: string;
  organizationId: string;
  projectId: string;
  companyName: string;
  aliases: string[];
  competitors: string[];
  languages: string[];
  engines: string[];
  /** ZDR add-on: request zero data retention from every model host. */
  enforceZdr: boolean;
  /** Models without a ZDR host the user approved to run anyway. */
  nonZdrApprovedEngines: string[];
  enabled: boolean;
  scanIntervalHours: number;
  scanStartedAt: string | null;
  lastScanAt: string | null;
  isScanning: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeoSettingsResponse {
  configured: boolean;
  settings: GeoSettings | null;
}

export interface GeoSettingsRow {
  id: string;
  organizationId: string;
  projectId: string;
  companyName: string;
  aliases: string[];
  competitors: string[];
  languages: string[] | null;
  engines: string[] | null;
  enforceZdr: boolean;
  nonZdrApprovedEngines: string[];
  enabled: boolean;
  scanIntervalHours: number;
  qstashMessageId: string | null;
  scanStartedAt: Date | null;
  lastScanAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  avgPosition?: number | null;
}

export type GeoStatDeltaKind = "rate" | "mentions" | "position";

export type GeoStatDeltaTone = "up" | "down" | "flat";

export interface EngineFamilyStatTrends {
  ratePts: number | null;
  mentionDelta: number | null;
  positionDelta: number | null;
}

export interface GeoGenerateTrace {
  text?: string;
  sources?: readonly unknown[];
  toolCalls?: readonly unknown[];
  toolResults?: readonly unknown[];
  providerMetadata?: unknown;
  steps?: readonly unknown[];
}

export interface GeoEngineAnswer {
  text: string;
  grounding: GeoCheckGrounding;
  finishReason: FinishReason | null;
  usage?: LanguageModelUsage;
  /** Whether the call ran with ZDR enforced; null when the route did not say. */
  zdrEnforced: boolean | null;
}

export interface GeoGroundedAnswer extends GeoEngineAnswer {
  sources: GeoCheckSourceItem[];
  usage: LanguageModelUsage;
}

export interface GeoCheckOutcome {
  row: GeoCheckWrite | null;
  usage: AgentTokenUsage;
}

export interface GeoSequenceCheckOutcome {
  rows: GeoCheckWrite[];
  usage: AgentTokenUsage;
  droppedTurns: number;
}

export type GeoCheckFailureReason =
  | "empty_answer"
  | "engine_error"
  | "judge_error"
  | "translation_error";

export type GeoScanSkipReason =
  | "billing"
  | "zdr"
  | "disabled"
  | "superseded"
  | "already_running";

export interface GeoErrorFields {
  errorName: string;
  errorMessage: string;
  causeName?: string;
  causeMessage?: string;
  finishReason?: FinishReason | null;
  usage?: LanguageModelUsage;
}

export interface GeoSkipFields extends Record<string, unknown> {
  event?: GeoLogEventName;
}

export interface GeoEngineAttemptSummary {
  engine: string;
  attempted: number;
  failed: number;
}

export interface GeoTimeseriesResponse {
  configured: boolean;
  points: GeoTimeseriesPoint[];
}

export type GeoSparklineMode = "all" | "search" | "memory";

export type GeoEngineMode = Exclude<GeoSparklineMode, "all">;

export interface MentionRateSparklineOptions {
  family?: string;
  model?: string;
  mode?: GeoSparklineMode;
}

export interface GeoSparklinePoint {
  day: string;
  value: number;
}

export interface EngineFamilyModeTrendRow {
  day: string;
  rawDay: string;
  search: number | null;
  memory: number | null;
  [key: string]: string | number | null;
}

export interface GeoAnswerSource {
  title: string;
  url: string;
  domain: string;
}

export interface GeoPromptResult {
  promptId: string;
  engine: string;
  prompt: string;
  answer: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  excerpt: string;
  searchQueries: string[];
  sources: GeoAnswerSource[];
  finishReason: string | null;
  promptTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  truncated: boolean | null;
  lastCheckedAt: string;
}

export interface GeoPromptResultsResponse {
  configured: boolean;
  results: GeoPromptResult[];
}

export interface GeoCompetitorSharePoint {
  brand: string;
  mentions: number;
  trend?: GeoSparklinePoint[];
}

export interface GeoCompetitorShareTimeseriesPoint {
  brand: string;
  day: string;
  mentions: number;
}

export interface GeoCompetitorShareResponse {
  configured: boolean;
  points: GeoCompetitorSharePoint[];
  timeseries: GeoCompetitorShareTimeseriesPoint[];
}

export interface GeoSettingsUpsertInput {
  organizationId: string;
  projectId?: string;
  companyName: string;
  aliases: string[];
  competitors: string[];
  languages: string[];
  engines: string[];
  enforceZdr: boolean;
  nonZdrApprovedEngines: string[];
  enabled: boolean;
  scanIntervalHours: number;
}

export interface SyncGeoScanScheduleInput {
  organizationId: string;
  projectId: string;
  enabled: boolean;
  scanIntervalHours: number;
  existingMessageId: string | null;
  reschedule?: boolean;
}

export interface GeoSampleDataResponse {
  projectId: string;
  promptsAdded: number;
  competitorsAdded: number;
  sequencesAdded: number;
  mentionChecks: number;
  trafficEvents: number;
  analyticsIngested: boolean;
}

export interface GeoSampleDataClearResponse {
  cleared: boolean;
  analyticsCleared: boolean;
}

export interface GeoTrackedPrompt {
  id: string;
  prompt: string;
  enabled: boolean;
  source: "custom" | "auto";
  createdAt: string | null;
}

export interface GeoPromptRow {
  id: string;
  organizationId: string;
  projectId: string;
  prompt: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoTrackedPromptsResponse {
  configured: boolean;
  prompts: GeoTrackedPrompt[];
}

export interface GeoPromptSequence {
  id: string;
  name: string;
  steps: string[];
  enabled: boolean;
  createdAt: string;
}

export interface GeoPromptSequenceRow {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  steps: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoSequencesResponse {
  sequences: GeoPromptSequence[];
}

export interface GeoSequenceCreateInput {
  id?: string;
  name: string;
  steps: string[];
}

export interface GeoSequenceUpdateInput {
  sequenceId: string;
  name?: string;
  steps?: string[];
  enabled?: boolean;
}

export interface GeoSequenceTurnResult {
  sequenceId: string;
  turn: number;
  engine: string;
  prompt: string;
  answer: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  excerpt: string;
  searchQueries: string[];
  sources: GeoAnswerSource[];
  finishReason: string | null;
  promptTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  truncated: boolean | null;
  lastCheckedAt: string;
}

export interface GeoSequenceRunResponse {
  checks: number;
  mentions: number;
  engines: string[];
}

export interface GeoSequenceResultsResponse {
  configured: boolean;
  results: GeoSequenceTurnResult[];
}

export interface GeoScanResult {
  status: "completed" | "skipped" | "invalid_payload";
  checks?: number;
  mentions?: number;
}

export interface GeoScanRetryResult {
  status: "retry_no_successful_checks";
  retryProjectIds: string[];
  checks: number;
  mentions: number;
}

export type GeoScanRunResult = GeoScanResult | GeoScanRetryResult;

export interface GeoScanProgramOptions {
  projectId?: string;
  claimedAt?: Date;
  scanId?: string;
  /** Explicit project subset for a retry pass; overrides `projectId` scoping. */
  projectIds?: readonly string[];
}

export interface GeoProjectScanOutcome {
  checks: number;
  mentions: number;
  usage: AgentTokenUsage;
}

export interface GeoPromptDefinition {
  id: string;
  text: string;
}

export interface GeoCheckTask {
  engine: string;
  grounded: GeoGroundedEngine | null;
  prompt: GeoPromptDefinition;
  language: string;
  zdr: GeoZdrMode;
}

/** Log context for the scan-time ZDR entitlement re-check. */
export interface GeoScanZdrPolicyFields {
  projectId: string;
  scanId?: string;
  sequenceId?: string;
}

/** Per-project ZDR inputs needed to decide how an engine may run. */
export interface GeoZdrPolicy {
  enforceZdr: boolean;
  nonZdrApprovedEngines: readonly string[];
  /**
   * Mode for engines when ZDR is not enforced. Defaults to `preferred`;
   * organizations without the ZDR add-on get `none`.
   */
  nonEnforcedMode?: GeoZdrMode;
}

/** Engine a scan will actually call after ZDR skip/fallback. */

export interface GeoCheckContext {
  catalog: GeoModelCatalog;
  organizationId: string;
  projectId: string;
  scanId: string;
  capturedAt: Date;
  companyName: string;
  aliases: string[];
}

export interface GeoSequenceDefinition {
  id: string;
  steps: string[];
}

export interface GeoBrandContext {
  companyDescription: string | null;
  audience: string | null;
}

export interface MentionTrendRow {
  day: string;
  rawDay: string;
  [engine: string]: string | number | null;
}

export interface MentionTrend {
  rows: MentionTrendRow[];
  engines: string[];
}

export interface FamilyDayBucket {
  mentions: number;
  checks: number;
  positionWeighted: number;
  positionWeight: number;
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
  /**
   * ZDR coverage when the catalog has no entry for `model`. Direct vendor
   * SDK engines bypass the router and can never honour ZDR.
   */
  zdr: GeoModelZdr;
  envVar: string | null;
  isAvailable: () => boolean;
}

export interface GeoGroundedInvocation {
  model: LanguageModel;
  tools: ToolSet;
}

export interface GeoGroundedInvocationOptions {
  organizationId?: string;
  zdr?: GeoZdrMode;
}

export interface GeoDiscoveredPrompt {
  prompt: string;
  title: string;
}

export interface GeoWebsiteDiscovery {
  companyName: string;
  aliases: string[];
  competitors: GeoCompetitorSeed[];
  prompts: GeoDiscoveredPrompt[];
}

export interface GeoGenerateFromWebsiteResult {
  companyName: string;
  aliases: string[];
  competitors: string[];
  promptsAdded: number;
}

export interface GeoDiscoverWebsiteResult {
  url: string;
  discovery: GeoWebsiteDiscovery;
}

export type GeoOnboardingStage = "brand" | "competitors" | "complete";

export interface GeoOnboardingBrandInput {
  organizationId: string;
  projectId?: string;
  companyName: string;
  aliases: string[];
  prompts: GeoDiscoveredPrompt[];
  languages?: string[];
  engines?: string[];
  enforceZdr?: boolean;
  nonZdrApprovedEngines?: string[];
}

export interface GeoOnboardingBrandResult {
  projectId: string;
  companyName: string;
  promptsAdded: number;
}

export interface GeoCompetitorSuggestion {
  name: string;
  domain: string | null;
  description: string | null;
  confidence: "high" | "medium" | null;
}

export interface GeoCompetitorSuggestionsResponse {
  domain: string;
  field: string | null;
  competitors: GeoCompetitorSuggestion[];
}

export interface GeoBrandSearchResult {
  domain: string;
  name: string;
  logo: string | null;
}

export interface GeoBrandSearchResponse {
  results: GeoBrandSearchResult[];
}

export interface GeoJudgeResult {
  mentioned: boolean;
  position: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  competitors: string[];
  excerpt: string;
}

export type GeoVisitorType = "crawler" | "ai_referral" | "human" | "unknown";

export interface GeoCliClientPattern {
  pattern: string;
  agent: string;
}

export interface GeoAcceptFingerprint {
  agent: string;
  userAgentPattern: string;
  accept: string;
}

export interface GeoTrafficSource {
  source: string;
  visitorType: GeoVisitorType;
  agent: string;
  category: string;
  confidence: string;
  visits: number;
  previousVisits?: number;
  markdownVisits: number;
  paths: number;
  lastSeenAt: string;
}

export interface GeoTrafficPoint {
  day: string;
  visitorType: GeoVisitorType;
  source: string;
  visits: number;
}

export interface GeoTrafficTrendRow {
  day: string;
  rawDay: string;
  crawler: number;
  aiReferral: number;
  [key: string]: string | number;
}

export interface GeoTrafficLogEntry {
  capturedAt: string;
  visitorType: GeoVisitorType;
  source: string;
  agent: string;
  category: string;
  confidence: string;
  path: string;
  host: string;
  country: string;
  ua: string;
  journeyId: string;
  wantsMarkdown: boolean;
}

export type GeoTrafficLogVisitorFilter = "crawler" | "ai_referral";

export type GeoTrafficLogPurposeFilter =
  | "training-crawler"
  | "search-index"
  | "assistant-browse";

export interface GeoTrafficLogVisitorOption {
  value: GeoTrafficLogVisitorFilter;
  label: string;
}

export interface GeoTrafficLogPurposeOption {
  value: GeoTrafficLogPurposeFilter;
  label: string;
}

export interface GeoTrafficLogFilters {
  visitorTypes: GeoTrafficLogVisitorFilter[];
  categories: GeoTrafficLogPurposeFilter[];
}

export interface GeoTrafficLogResponse {
  configured: boolean;
  log: GeoTrafficLogEntry[];
  total: number;
}

export type GeoJourneyPathKind = "home" | "docs" | "blog" | "search" | "page";

export interface GeoJourney {
  journeyId: string;
  source: string;
  visitorType: GeoVisitorType;
  pages: number;
  distinctPaths: number;
  firstSeenAt: string;
  lastSeenAt: string;
  samplePaths: string[];
}

export interface GeoTrafficJourneysResponse {
  configured: boolean;
  journeys: GeoJourney[];
}

export interface GeoJourneyEvent {
  capturedAt: string;
  path: string;
  host: string;
  method: string;
  referer: string;
  country: string;
  agent: string;
  category: string;
}

export interface GeoJourneyDetailResponse {
  configured: boolean;
  events: GeoJourneyEvent[];
}

export interface GeoTrafficTotals {
  crawler: number;
  aiReferral: number;
}

export interface TrafficMetricDeltas {
  crawler: number | null;
  aiReferral: number | null;
  total: number | null;
}

export interface AiTrafficResponse {
  configured: boolean;
  totals: GeoTrafficTotals;
  sources: GeoTrafficSource[];
  points: GeoTrafficPoint[];
}

export interface GeoTrafficPage {
  path: string;
  source: string;
  visitorType: GeoVisitorType;
  visits: number;
  previousVisits?: number;
  lastSeenAt: string;
}

export interface GeoTrafficPagesResponse {
  configured: boolean;
  pages: GeoTrafficPage[];
}

export type GeoIngestFramework = "next" | "nuxt" | "netlify";

export type GeoIngestPackageManager = "bun" | "pnpm" | "yarn" | "npm";

/** Install snippet per supported framework. */
export type GeoIngestSnippets = Record<GeoIngestFramework, string>;

/** Who a verified tracking token belongs to. */
export interface GeoIngestIdentity {
  organizationId: string;
  projectId: string | null;
  generation: number;
}

/** Everything needed to install tracking except the token itself. */
export interface GeoIngestSetupInfo {
  ingestUrl: string;
  snippet: string;
  snippets: GeoIngestSnippets;
}

export interface GeoIngestSetupResponse extends GeoIngestSetupInfo {
  token: string;
}

export type GeoPresenceStatus =
  | "training-data"
  | "retrieval-only"
  | "invisible";

export interface GeoEngineVariant {
  model: string;
  web: GeoOverviewEngine | null;
  raw: GeoOverviewEngine | null;
}

export interface GeoEngineFamily {
  family: string;
  variants: GeoEngineVariant[];
}

export interface GeoEngineFamilyTotals {
  mentions: number;
  checks: number;
  rate: number;
}

export interface MentionProviderRow {
  family: GeoEngineFamily;
  totals: GeoEngineFamilyTotals;
  mentionDelta: number | null;
  tracked: boolean;
}

export interface GeoLanguageSharePoint {
  language: string;
  checks: number;
  mentions: number;
  mentionRate: number;
  avgPosition: number | null;
  trend?: GeoSparklinePoint[];
}

export interface LanguagePerformanceTrackedRow extends GeoLanguageSharePoint {
  kind: "tracked";
}

export interface LanguagePerformanceSuggestedRow {
  kind: "suggested";
  language: string;
}

export type LanguagePerformanceRow =
  | LanguagePerformanceTrackedRow
  | LanguagePerformanceSuggestedRow;

export interface GeoLanguageShareResponse {
  configured: boolean;
  points: GeoLanguageSharePoint[];
}

export interface GeoPromptSummary {
  promptId: string;
  prompt: string;
  mentioned: number;
  total: number;
  bestPosition: number | null;
  presence: GeoPresenceStatus | null;
  results: GeoPromptResult[];
}

export type GeoTab = "visibility" | "prompts" | "journeys";

export type GeoRangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "14d"
  | "30d"
  | "90d"
  | "ytd";

export interface GeoWindowInput {
  days?: number;
  from?: string;
  to?: string;
}

export interface GeoTrafficSourceGroupDefinition {
  key: string;
  label: string;
  icon: string | null;
}

export type EngineIconKey =
  | "openai"
  | "claude"
  | "gemini"
  | "google"
  | "amazon"
  | "perplexity"
  | "mistral"
  | "deepseek"
  | "meta"
  | "grok"
  | "qwen"
  | "copilot"
  | "tencent"
  | "xiaomi"
  | "cursor"
  | "apple"
  | "duckduckgo"
  | "cloudflare"
  | "tiktok"
  | "mozilla"
  | "manus"
  | "firecrawl"
  | "cohere"
  | "opencode"
  | "kimi"
  | "zai"
  | "exa"
  | "commoncrawl"
  | "youcom"
  | "liner"
  | "cline"
  | "devin"
  | "diffbot"
  | "tavily"
  | "timpi"
  | "huawei"
  | "kagi"
  | "agent"
  | "cli";

export type GeoChatSkin = "claude" | "chatgpt" | "gemini" | "perplexity";

export interface EngineIconRule {
  key: EngineIconKey;
  patterns: readonly string[];
  /** Values that must equal the whole engine string, for short vendor names. */
  exact?: readonly string[];
}

export type GeoModelProviderId =
  | "anthropic"
  | "openai"
  | "google"
  | "moonshotai"
  | "meta"
  | "zai"
  | "spacexai"
  | "deepseek"
  | "mistral"
  | "cursor";

/** Zero-data-retention coverage as reported by the Vercel AI Gateway feed. */
export type GeoModelZdr = "all" | "some" | "none";

/**
 * Where a model is served. `cursor` runs through the Cursor SDK instead of
 * the AI router (see `lib/geo/cursor.ts`).
 */
export type GeoModelGateway = "vercel" | "openrouter" | "cursor";

export interface GeoModelProvider {
  id: GeoModelProviderId;
  label: string;
  /** Key into GEO_BRAND_LABELS / icon rules. */
  brand: string;
  /** Featured providers are visible without expanding "more providers". */
  featured: boolean;
}

export interface GeoModelCatalogEntry {
  id: string;
  provider: GeoModelProviderId;
  label: string;
  zdr: GeoModelZdr;
  /** ISO date (YYYY-MM-DD). */
  released: string;
  /** Part of the default engine set for new projects. */
  default: boolean;
  /** Gateways that serve the model; OpenRouter-only models are pinned. */
  gateways: readonly GeoModelGateway[];
}

export interface GeoModelCatalog {
  providers: GeoModelProvider[];
  models: GeoModelCatalogEntry[];
}

/** One model as published by the Vercel AI Gateway feed. */
export interface GeoGatewayModel {
  id: string;
  name: string;
  owned_by: string;
  type: string;
  zdr: GeoModelZdr;
  /** Unix seconds. */
  released: number;
  deprecated_at?: number | string | null;
  tags?: string[];
}

/** How strictly a scan asks the router for zero data retention. */
export type GeoZdrMode = "required" | "preferred" | "none";

/** Result of a ZDR entitlement lookup; `unknown` means billing did not answer. */
export type GeoZdrEntitlement = "entitled" | "not_entitled" | "unknown";

export interface ShareOfVoiceRow {
  brand: string;
  mentions: number;
  share: number;
  trend: GeoSparklinePoint[];
}

export interface ShareOfVoiceBreakdown {
  rows: ShareOfVoiceRow[];
  others: ShareOfVoiceRow[];
}

export interface ShareOfVoiceDonutSlice extends ShareOfVoiceRow {
  slice: string;
  [key: string]: unknown;
}

export type GeoCompetitorKind = "direct" | "indirect";

export interface GeoCompetitor {
  id: string;
  name: string;
  domain: string | null;
  synonyms: string[];
  kind: GeoCompetitorKind;
  color: string | null;
}

export interface GeoCompetitorSeed {
  name: string;
  domain: string | null;
  synonyms?: string[];
  kind?: GeoCompetitorKind;
  color?: string | null;
}

export interface GeoCompetitorRow {
  id: string;
  organizationId: string;
  name: string;
  domain: string | null;
  synonyms: string[];
  kind: GeoCompetitorKind;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type GeoCompetitorMerge = (
  current: GeoCompetitor[]
) => readonly GeoCompetitorSeed[];

export type GeoCompetitorReconcileOutcome =
  | { status: "limit" }
  | { status: "ok"; competitors: GeoCompetitor[] };

export interface GeoPromptInsert {
  prompt: string;
  title?: string | null;
  enabled?: boolean;
}

export interface GeoInsertedPrompt {
  id: string;
  prompt: string;
}

export interface GeoCompetitorsResponse {
  competitors: GeoCompetitor[];
}

export interface GeoCompetitorUpsertInput {
  name: string;
  previousName?: string;
  domain: string | null;
  synonyms?: string[];
  kind?: GeoCompetitorKind;
  color?: string | null;
}

export interface GeoCompetitorTimeseriesPoint {
  day: string;
  mentions: number;
  checks: number;
}

export interface GeoCompetitorPromptRow {
  promptId: string;
  prompt: string;
  engine: string;
  capturedAt: string;
  mentioned: boolean;
  position: number | null;
}

export interface GeoCompetitorDetailResponse {
  configured: boolean;
  points: GeoCompetitorTimeseriesPoint[];
  prompts: GeoCompetitorPromptRow[];
}

export type GeoCompetitorTypeFilter = "all" | GeoCompetitorKind;

export interface GeoSuggestionKeyword {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

// --- GEO writer ---

export type GeoWriterSourceKind =
  | "manual"
  | "gap"
  | "prompt"
  | "search_console";

export interface GeoWriterPlanInput {
  topic: string;
  autoApprove: boolean;
  contentSubtype?: GeoContentSubtype;
  brandVoiceIds?: string[];
  competitorIds?: string[];
  sitemapId?: string;
  sourceKind?: GeoWriterSourceKind;
  sourceId?: string;
}

export interface GeoWriterPlanResponse {
  briefId: string;
  brief: GeoContentBrief;
  status: GeoContentBriefStatus;
  runId: string | null;
  postId: string | null;
}

export type GeoGapWriteAction = "write" | "review" | "writing" | "open";

export interface GeoGapBriefRef {
  briefId: string;
  status: GeoContentBriefStatus;
  postId: string | null;
  workingTitle: string | null;
}

export interface GeoPromptGapRow {
  id: string;
  prompt: string;
  title: string | null;
  engines: string[];
  competitors: string[];
  ownMentionRate: number;
  engineCoverage: number;
  opportunity: number;
  brief: GeoGapBriefRef | null;
}

export interface GeoSearchGapRow {
  id: string;
  prompt: string;
  title: string | null;
  impressions: number | null;
  brief: GeoGapBriefRef | null;
}

export interface GeoContentGapsResponse {
  promptGaps: GeoPromptGapRow[];
  searchGaps: GeoSearchGapRow[];
  hasScanData: boolean;
}

export interface GeoWriterStartResponse {
  runId: string;
}

export interface GeoContentBriefDetail {
  id: string;
  topic: string;
  brief: GeoContentBrief;
  status: GeoContentBriefStatus;
  autoApproved: boolean;
  runId: string | null;
  postId: string | null;
  humanized: boolean;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface GeoContentBriefSummary {
  id: string;
  topic: string;
  workingTitle: string;
  status: GeoContentBriefStatus;
  postId: string | null;
  createdAt: string;
}

export interface GeoContentBriefsResponse {
  briefs: GeoContentBriefSummary[];
}

export interface GeoWriterPayload {
  organizationId: string;
  projectId: string;
  briefId: string;
  runId: string;
}
