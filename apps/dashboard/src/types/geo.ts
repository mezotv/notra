import type {
  GeoContentBrief,
  GeoContentSubtype,
} from "@notra/ai/types/geo-writer";
import type { GeoContentBriefStatus } from "@notra/db/types/geo-writer";
import type { GeoRequestPayload } from "@usenotra/geo";
import type { LanguageModel, ToolSet } from "ai";
import type { ReactNode } from "react";

import type { ChartColorPair } from "@/types/charts";

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

export interface GeoProjectCreateInput {
  name: string;
  brandSettingsId: string;
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

export interface GeoIngestIdentity {
  organizationId: string;
  projectId: string | null;
  generation: number;
}

export interface GeoProjectContextValue {
  projectId: string | undefined;
}

export interface GeoProjectProviderProps {
  projectId: string | undefined;
  children: ReactNode;
}

export interface GeoProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onCreated: (projectId: string) => void;
}

export interface GeoProjectLogoProps {
  name: string;
  domain: string | null;
  className?: string;
  /** Applied only while the generated placeholder avatar is shown. */
  fallbackClassName?: string;
}

export interface GeoPageClientProps {
  organizationSlug: string;
}

export interface GeoLayoutProps {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ slug: string }>;
}

export interface PromptFunnelCardProps {
  promptCount: number;
  results: GeoPromptResult[];
  isScanning?: boolean;
}

export interface GeoPageContentProps {
  organizationSlug: string;
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

export interface GeoPromptResult {
  promptId: string;
  engine: string;
  prompt: string;
  answer: string;
  mentioned: boolean;
  position: number | null;
  sentiment: string | null;
  excerpt: string;
  lastCheckedAt: string;
}

export interface PromptEngineSwitcherProps {
  results: readonly { engine: string }[];
  active: { engine: string };
  onChange: (engine: string, direction: number) => void;
}

export interface GeoPromptResultsResponse {
  configured: boolean;
  results: GeoPromptResult[];
}

export interface GeoCompetitorSharePoint {
  brand: string;
  mentions: number;
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

export interface GeoSettingsUpsertOptions {
  silentSuccess?: boolean;
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

export interface GeoPromptTableRow {
  id: string;
  prompt: string;
  enabled: boolean;
  source: GeoTrackedPrompt["source"];
  mentioned: number;
  total: number;
  bestPosition: number | null;
  presence: GeoPresenceStatus | null;
  results: GeoPromptResult[];
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

export interface GeoAnswerSource {
  url: string;
  title: string | null;
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
  sources: GeoAnswerSource[];
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

export interface ConversationsCardProps {
  organizationId: string;
}

export interface ConversationTurnDraft {
  id: string;
  text: string;
}

export interface ConversationBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  sequence: GeoPromptSequence | null;
}

export interface ConversationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  sequence: GeoPromptSequence | null;
  onRun: () => void;
  isRunning: boolean;
}

export interface GeoSequenceEngineThread {
  engine: string;
  turns: GeoSequenceTurnResult[];
}

export interface ConversationReplayThreadProps {
  engine: string;
  turns: GeoSequenceTurnResult[];
  playToken: number;
}

export interface GeoScanPayload {
  organizationId: string;
  projectId?: string;
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

export interface GeoCheckTask {
  engine: string;
  grounded: GeoGroundedEngine | null;
  prompt: GeoPromptDefinition;
  language: string;
  zdr: GeoZdrMode;
}

/** Per-project ZDR inputs needed to decide how an engine may run. */
export interface GeoZdrPolicy {
  enforceZdr: boolean;
  nonZdrApprovedEngines: readonly string[];
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

export interface GeoGenerateFromWebsiteInput {
  url: string;
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

export interface GeoCompetitorSuggestionsInput {
  domain: string;
}

export interface GeoBrandSearchInput {
  query: string;
}

export type GeoCompetitorSuggestionsHandlerInput = GeoScopeInput &
  GeoCompetitorSuggestionsInput;

export type GeoBrandSearchHandlerInput = GeoScopeInput & GeoBrandSearchInput;

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

export interface GeoVisitorSignals {
  clientHints: boolean;
  fetchMode: string | null;
  tracing: boolean;
}

export interface GeoVisitorInput {
  userAgent: string | undefined;
  referer: string | undefined;
  accept: string | undefined;
  signals?: GeoVisitorSignals;
}

export interface GeoCliClientPattern {
  pattern: string;
  agent: string;
}

export interface GeoAcceptFingerprint {
  agent: string;
  userAgentPattern: string;
  accept: string;
}

export interface GeoVisitorClassification {
  visitorType: GeoVisitorType;
  source: string;
  agent: string;
  category: string;
  confidence: string;
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

export interface GeoTrafficLogQueryOptions {
  refetchInterval?: number | false;
}

export interface GeoTrafficLogResponse {
  configured: boolean;
  log: GeoTrafficLogEntry[];
  total: number;
}

export interface GeoJourneyInput {
  url: URL;
  source: string;
  ip: string | undefined;
  capturedAt: Date;
  visitorType: GeoVisitorType;
  category: string;
}

export interface GeoJourneyTuning {
  bucketSeconds: number;
  fullIp: boolean;
}

export interface GeoTrafficEventInput {
  organizationId: string;
  projectId: string | null;
  payload: GeoRequestPayload;
  url: URL;
  capturedAt: Date;
  classification: GeoVisitorClassification;
  journey: GeoJourneyResolution;
}

export interface GeoJourneyResolution {
  journeyId: string;
  path: string;
}

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

export interface JourneysCardProps {
  journeys: GeoJourney[];
  organizationId: string;
}

export interface JourneyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  journey: GeoJourney | null;
}

export interface GeoTrafficTotals {
  crawler: number;
  aiReferral: number;
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

export type GeoIngestSnippets = Record<GeoIngestFramework, string>;

export interface GeoIngestSetupResponse {
  ingestUrl: string;
  token: string;
  snippet: string;
  snippets: GeoIngestSnippets;
}

export interface GeoIngestSetupPanelProps {
  setup: GeoIngestSetupResponse | undefined;
  className?: string;
}

export interface TrafficEmptyProps {
  setup: GeoIngestSetupResponse | undefined;
}

export interface GeoSetupEmptyProps {
  settingsHref: string;
}

export interface GeoScanScheduleProps {
  id: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  intervalHours: number;
  onIntervalChange: (hours: number) => void;
}

export interface AiTrafficCardProps {
  traffic: AiTrafficResponse | undefined;
}

export interface TrafficPagesCardProps {
  pages: GeoTrafficPage[];
  isPending?: boolean;
}

export type GeoPresenceStatus =
  | "training-data"
  | "retrieval-only"
  | "invisible";

export interface PresenceBadgeProps {
  status: GeoPresenceStatus | null;
}

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

export interface GeoBarProps {
  value: number;
  max?: number;
  className?: string;
  fillClassName?: string;
  fillColor?: string;
}

export interface GeoRateSparklineProps {
  points: readonly GeoSparklinePoint[];
  className?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export interface GeoPromptCoverage {
  mentioned: number;
  total: number;
  rate: number | null;
}

export interface GeoLanguageSharePoint {
  language: string;
  checks: number;
  mentions: number;
  mentionRate: number;
  avgPosition: number | null;
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

export interface LanguagePerformanceCardProps {
  points: GeoLanguageSharePoint[];
  organizationId: string;
  settings: GeoSettings;
  isScanning?: boolean;
}

export interface MentionRateCardProps {
  engines: GeoOverviewEngine[];
  timeseriesPoints?: readonly GeoTimeseriesPoint[];
  promptResults?: readonly GeoPromptResult[];
  isScanning?: boolean;
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

export interface PromptResultsPreviewProps {
  results: GeoPromptResult[];
  limit?: number;
  action?: ReactNode;
  isScanning?: boolean;
}

export interface EngineRateTableProps {
  engines: GeoOverviewEngine[];
  timeseriesPoints?: readonly GeoTimeseriesPoint[];
  promptResults?: readonly GeoPromptResult[];
  isScanning?: boolean;
}

export interface EngineFamilyPromptHit {
  promptId: string;
  prompt: string;
  mentioned: boolean;
  position: number | null;
}

export interface EngineFamilySheetProps {
  family: GeoEngineFamily | null;
  timeseriesPoints?: readonly GeoTimeseriesPoint[];
  promptResults?: readonly GeoPromptResult[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type GeoTab = "visibility" | "prompts" | "journeys";

export interface GeoTabsProps {
  activeTab: GeoTab;
  onActiveTabChange: (tab: GeoTab) => void;
  organizationSlug: string;
  revealActive: boolean;
  settings: GeoSettings;
  engines: GeoOverviewEngine[];
  timeseriesPoints: GeoTimeseriesPoint[];
  competitorPoints: GeoCompetitorSharePoint[];
  competitorShareTimeseries?: readonly GeoCompetitorShareTimeseriesPoint[];
  competitors: GeoCompetitor[];
  languagePoints: GeoLanguageSharePoint[];
  promptResults: GeoPromptResult[];
  promptCount: number;
  isScanning: boolean;
  journeys: GeoJourney[];
  organizationId: string;
}

export type GeoRangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "14d"
  | "30d"
  | "90d"
  | "ytd";

export interface GeoDateRange {
  dateFrom: string;
  dateTo: string;
}

export interface GeoRangeState {
  preset: GeoRangePreset | "custom";
  range: GeoDateRange;
}

export interface GeoRangeQuery {
  from: string;
  to: string;
}

export interface GeoWindowInput {
  days?: number;
  from?: string;
  to?: string;
}

export interface GeoRangeControl extends GeoRangeState {
  label: string;
  days: number;
  query: GeoRangeQuery;
  param: string | null;
  setPreset: (preset: GeoRangePreset) => void;
  setCustom: (range: GeoDateRange) => void;
}

export interface MentionTrendSeries {
  key: string;
  engine: string;
  label: string;
}

export interface MentionTrendCardProps {
  points: GeoTimeseriesPoint[];
  isScanning?: boolean;
}

export interface GeoRangePickerProps {
  control: GeoRangeControl;
}

export interface MentionTrendAgentsPickerProps {
  series: readonly MentionTrendSeries[];
  hiddenKeys: ReadonlySet<string>;
  onToggle: (key: string) => void;
  disabled?: boolean;
}

export interface AiTrafficLogCardProps {
  organizationId: string;
}

export interface CitationsTableProps {
  entries: GeoTrafficLogEntry[];
  height: number;
  loading?: boolean;
}

export interface PurposeBadgeProps {
  category: string;
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

export interface GeoSkinMessageProps {
  skin: GeoChatSkin;
  from: "user" | "assistant";
  search?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export interface EngineIconProps {
  engine: string;
  className?: string;
}

export interface GeoProviderWordmarkProps {
  provider: string;
  label: string;
  className?: string;
}

export interface GeoModeIconProps {
  mode: GeoSparklineMode;
  className?: string;
}

export interface EngineIconRule {
  key: EngineIconKey;
  patterns: readonly string[];
  /** Values that must equal the whole engine string, for short vendor names. */
  exact?: readonly string[];
}

export interface ParsedModelId {
  provider: string;
  slug: string;
}

export interface ModelProviderLogoProps {
  provider: string;
  className?: string;
}

export interface CodeSnippetProps {
  code: string;
  className?: string;
  filename?: string;
  headerEnd?: ReactNode;
  variant?: "command" | "panel";
}

export interface GeoSettingsFormProps {
  organizationId: string;
  settings: GeoSettings | null;
  catalog: GeoModelCatalog;
}

export interface GeoSubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  settings: GeoSettings | null;
  companyName: string;
  enabled: boolean;
}

export interface GeoTagListProps {
  id: string;
  label: string;
  description?: ReactNode;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  max: number;
  disabled?: boolean;
  /** When false, the field still has an accessible name via `label`. */
  labeled?: boolean;
  inputClassName?: string;
}

export interface GeoEnginePickerProps {
  catalog: GeoModelCatalog;
  selected: string[];
  onChange: (values: string[]) => void;
  enforceZdr: boolean;
  onEnforceZdrChange: (value: boolean) => void;
  nonZdrApproved: string[];
  onNonZdrApprovedChange: (values: string[]) => void;
  /** Whether the organization may enforce ZDR (ZDR add-on). */
  canEnforceZdr: boolean;
  /** True while the plan is still loading; keeps the ZDR toggle inert. */
  planLoading?: boolean;
  disabled?: boolean;
  labeled?: boolean;
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

export type GeoCursorFlagState = "enabled" | "disabled" | "unavailable";

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
export type GeoZdrMode = "required" | "preferred";

export interface GeoLanguagePickerProps {
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  labeled?: boolean;
}

export interface ShareOfVoiceRow {
  brand: string;
  mentions: number;
  share: number;
}

export interface ShareOfVoiceCardProps {
  points: GeoCompetitorSharePoint[];
  timeseries?: readonly GeoCompetitorShareTimeseriesPoint[];
  competitors?: GeoCompetitor[];
  action?: ReactNode;
  isScanning?: boolean;
  organizationSlug?: string;
  organizationId?: string;
  companyName?: string | null;
  aliases?: readonly string[];
}

export interface ShareOfVoiceTableProps {
  points: GeoCompetitorSharePoint[];
  timeseries?: readonly GeoCompetitorShareTimeseriesPoint[];
  competitors?: GeoCompetitor[];
  limit?: number;
  isScanning?: boolean;
  onRowClick?: (row: ShareOfVoiceRow) => void;
  onRowPointerEnter?: (row: ShareOfVoiceRow) => void;
  companyName?: string | null;
  aliases?: readonly string[];
}

export interface ShareOfVoiceDonutSlice extends ShareOfVoiceRow {
  slice: string;
  [key: string]: string | number;
}

export interface ShareOfVoiceDonutProps {
  points: GeoCompetitorSharePoint[];
  competitors?: GeoCompetitor[];
  limit?: number;
  isScanning?: boolean;
  onSliceClick?: (row: ShareOfVoiceRow) => void;
  onSlicePointerEnter?: (row: ShareOfVoiceRow) => void;
  companyName?: string | null;
  aliases?: readonly string[];
}

export interface CompetitorShareCardProps {
  points: GeoCompetitorSharePoint[];
  companyName: string | null;
  aliases?: readonly string[];
  competitors?: GeoCompetitor[];
  isScanning?: boolean;
  organizationSlug?: string;
  organizationId?: string;
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

export interface CompetitorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  competitor: GeoCompetitor | null;
}

export interface CompetitorEditFormProps {
  organizationId: string;
  competitor: GeoCompetitor | null;
  onDone: () => void;
  onCancel?: () => void;
}

export interface GeoCompetitorTimeseriesPoint {
  day: string;
  mentions: number;
  checks: number;
}

export interface GeoCompetitorDetailPoint {
  day: string;
  rawDay: string;
  mentions: number;
  [key: string]: string | number;
}

export interface GeoCompetitorMentionStats {
  latest: number;
  latestDay: string;
  peak: number;
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

export interface CompetitorsTableProps {
  competitors: GeoCompetitor[];
  organizationId: string;
  organizationSlug: string;
  companyName: string;
  aliases: string[];
}

export interface PromptsTableProps {
  organizationId: string;
  prompts: GeoTrackedPrompt[];
  results: GeoPromptResult[];
  isScanning?: boolean;
}

export type PromptAddMode = "write" | "website";

export interface PromptAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export interface GeoRemoveDialogNouns {
  singular: string;
  plural: string;
}

export interface GeoRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: string[];
  onConfirm: () => void;
  isPending: boolean;
  nouns: GeoRemoveDialogNouns;
  description: string | ((items: string[]) => string);
}

export interface PromptDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: GeoPromptTableRow | null;
  isScanning?: boolean;
}

export interface GeoPromptAnswerThreadProps {
  prompt: string;
  result: GeoPromptResult;
}

export type GeoCompetitorTypeFilter = "all" | GeoCompetitorKind;

export interface GeoCompetitorRowEntry {
  id: string;
  name: string;
  domain: string | null;
  synonyms: string[];
  kind: GeoCompetitorKind;
  isOwnBrand: boolean;
  color: ChartColorPair;
}

export interface CompetitorLogoProps {
  name: string;
  domain: string | null;
  className?: string;
  onSettled?: () => void;
}

export interface CompetitorLogoPreviewProps {
  name: string;
  website: string;
  className?: string;
}

export interface CompetitorDetailViewProps {
  organizationSlug: string;
  competitor: string;
  variant?: "modal" | "page";
}

export interface CompetitorSheetProps {
  title: string;
  children: ReactNode;
}

export interface CompetitorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  competitor: string | null;
  domain: string | null;
}

export interface CompetitorRowProps {
  competitor: string;
  domain: string | null;
  isPending: boolean;
  onSelect: (competitor: string) => void;
  onRemove: (competitor: string) => void;
}

export interface CountryFlagProps {
  code: string;
  className?: string;
}

export interface TwemojiProps {
  emoji: string;
  label: string;
  className?: string;
}

export interface GeoSuggestionKeyword {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface GeoPromptSuggestionRow {
  id: string;
  prompt: string;
  title: string | null;
  source: "search_console";
  sourceKeywords: GeoSuggestionKeyword[];
  createdAt: Date;
}

export interface GeoPromptSuggestion {
  id: string;
  prompt: string;
  source: "search_console";
  keywords: GeoSuggestionKeyword[];
  createdAt: string;
}

export interface GeoPromptSuggestionsResponse {
  suggestions: GeoPromptSuggestion[];
}

export interface GeoSuggestionIdInput {
  suggestionId: string;
}

export interface GeoSectionSkeletonProps {
  eyebrow: string;
  action?: ReactNode;
  children: ReactNode;
}

export interface GeoTableSkeletonProps {
  rows: number;
}

export interface GeoSettingsSkeletonSectionProps {
  title: string;
  description: string;
  children: ReactNode;
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

export interface GeoWriterContext {
  organizationId: string;
  projectId: string;
  briefId: string;
  brandSettingsId: string;
  collectionId: string;
  postId: string | null;
  brandName: string;
  language: string | null;
  topic: string;
  brief: GeoContentBrief;
}

export type GeoWriterWorkflowResult =
  | { status: "success"; postId: string; humanized: boolean }
  | { status: "failed"; reason: string }
  | { status: "credits_exhausted" }
  | { status: "duplicate_execution" }
  | { status: "invalid_state" }
  | { status: "invalid_payload" };
