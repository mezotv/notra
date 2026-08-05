import type { GeoRequestPayload } from "@usenotra/geo";
import type { ReactNode } from "react";
import type { ChartColorPair } from "@/types/charts";

export interface GeoSettings {
  id: string;
  organizationId: string;
  companyName: string;
  aliases: string[];
  competitors: string[];
  languages: string[];
  enabled: boolean;
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
  companyName: string;
  aliases: string[];
  competitors: string[];
  languages: string[] | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoEngineCoverage {
  mentions: number;
  checks: number;
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
  languages: string[];
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
  competitors: GeoCompetitorSeed[];
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

export type AiTrafficCategory =
  | "training-crawler"
  | "search-index"
  | "assistant-browse";

export type GeoVisitorType = "crawler" | "ai_referral" | "human" | "unknown";

export interface GeoVisitorInput {
  userAgent: string | undefined;
  referer: string | undefined;
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
  markdownVisits: number;
  paths: number;
  lastSeenAt: string;
}

export interface GeoTrafficPoint {
  day: string;
  visitorType: GeoVisitorType;
  visits: number;
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

export type GeoTrafficLogVisitorFilter = "crawler" | "ai_referral" | "human";

export type GeoTrafficLogPurposeFilter =
  | "training-crawler"
  | "search-index"
  | "assistant-browse";

export type GeoTrafficLogFilterAll = "all";

export interface GeoTrafficLogVisitorOption {
  value: GeoTrafficLogVisitorFilter | GeoTrafficLogFilterAll;
  label: string;
}

export interface GeoTrafficLogPurposeOption {
  value: GeoTrafficLogPurposeFilter | GeoTrafficLogFilterAll;
  label: string;
}

export interface GeoTrafficLogFilters {
  visitorType: GeoTrafficLogVisitorFilter | GeoTrafficLogFilterAll;
  category: GeoTrafficLogPurposeFilter | GeoTrafficLogFilterAll;
}

export interface GeoTrafficLogResponse {
  configured: boolean;
  log: GeoTrafficLogEntry[];
}

export interface GeoTrafficLogInput {
  limit?: number;
  visitorType?: GeoTrafficLogVisitorFilter;
  category?: GeoTrafficLogPurposeFilter;
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

export interface GeoTrafficJourneysInput {
  days?: number;
  limit?: number;
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

export interface GeoJourneyDetailPoint {
  point: string;
  pages: number;
  [key: string]: string | number;
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
  human: number;
}

export interface AiTrafficResponse {
  configured: boolean;
  totals: GeoTrafficTotals;
  sources: GeoTrafficSource[];
  points: GeoTrafficPoint[];
}

export interface AiTrafficInput {
  days?: number;
  limit?: number;
}

export interface GeoTrafficPage {
  path: string;
  source: string;
  visitorType: GeoVisitorType;
  visits: number;
  lastSeenAt: string;
}

export interface GeoTrafficPagesResponse {
  configured: boolean;
  pages: GeoTrafficPage[];
}

export interface GeoTrafficPagesInput {
  days?: number;
  limit?: number;
  visitorType?: GeoVisitorType;
}

export interface GeoIngestSetupResponse {
  ingestUrl: string;
  token: string;
  snippet: string;
}

export interface AiTrafficCardProps {
  traffic: AiTrafficResponse | undefined;
  setup: GeoIngestSetupResponse | undefined;
}

export interface TrafficPagesCardProps {
  pages: GeoTrafficPage[];
}

export type GeoPresenceStatus =
  | "training-data"
  | "retrieval-only"
  | "invisible";

export interface GeoEngineFamily {
  family: string;
  web: GeoOverviewEngine | null;
  raw: GeoOverviewEngine | null;
}

export interface GeoHeroSummary {
  visibilityRate: number | null;
  grounded: boolean;
  gapPoints: number | null;
  bestEngine: GeoOverviewEngine | null;
}

export interface GeoSummaryStatsProps {
  engines: GeoOverviewEngine[];
  settings: GeoSettings;
  promptCount: number;
}

export interface GeoStatTile {
  label: string;
  value: string;
  hint: string;
  engine?: string;
}

export interface GeoLanguageSharePoint {
  language: string;
  checks: number;
  mentions: number;
  mentionRate: number;
  avgPosition: number | null;
}

export interface GeoLanguageShareResponse {
  configured: boolean;
  points: GeoLanguageSharePoint[];
}

export interface ModelUsageCardProps {
  usage: GeoModelUsageResponse | undefined;
}

export interface LanguagePerformanceCardProps {
  points: GeoLanguageSharePoint[];
  configuredLanguages: string[];
}

export interface MentionRateCardProps {
  engines: GeoOverviewEngine[];
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
  languages?: string[];
}

export interface EngineRateTableProps {
  engines: GeoOverviewEngine[];
}

export type GeoTab = "visibility" | "prompts" | "traffic" | "journeys";

export interface GeoTabsProps {
  activeTab: GeoTab;
  onActiveTabChange: (tab: GeoTab) => void;
  organizationSlug: string;
  revealActive: boolean;
  settings: GeoSettings;
  engines: GeoOverviewEngine[];
  timeseriesPoints: GeoTimeseriesPoint[];
  competitorPoints: GeoCompetitorSharePoint[];
  competitors: GeoCompetitor[];
  languagePoints: GeoLanguageSharePoint[];
  promptResults: GeoPromptResult[];
  promptCount: number;
  modelUsage: GeoModelUsageResponse | undefined;
  traffic: AiTrafficResponse | undefined;
  ingestSetup: GeoIngestSetupResponse | undefined;
  trafficPages: GeoTrafficPage[];
  journeys: GeoJourney[];
  organizationId: string;
}

export interface MentionTrendCardProps {
  hero?: boolean;
  points: GeoTimeseriesPoint[];
}

export interface AiTrafficLogCardProps {
  organizationId: string;
}

export type EngineIconKey =
  | "openai"
  | "claude"
  | "gemini"
  | "perplexity"
  | "mistral"
  | "deepseek"
  | "meta"
  | "grok"
  | "qwen"
  | "copilot";

export interface EngineIconProps {
  engine: string;
  className?: string;
}

export interface EngineIconRule {
  key: EngineIconKey;
  patterns: readonly string[];
}

export interface CodeSnippetProps {
  code: string;
  className?: string;
}

export interface GeoOnboardingOverlayProps {
  organizationId: string;
  onManualSetup: () => void;
}

export interface GeoSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  settings: GeoSettings | null;
}

export interface GeoSubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  settings: GeoSettings | null;
  companyName: string;
  enabled: boolean;
}

export interface GeoSettingsSectionRowProps {
  label: string;
  count: number;
  disabled: boolean;
  onClick: () => void;
}

export interface GeoStringListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  columnLabel: string;
  addPlaceholder: string;
  addLabel: string;
  emptyLabel: string;
  values: string[];
  isPending: boolean;
  onSave: (values: string[]) => void;
  footer?: ReactNode;
}

export interface GeoCompetitorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export interface ShareOfVoiceSlice {
  brand: string;
  mentions: number;
  slice: string;
  [key: string]: string | number;
}

export interface ShareOfVoiceDonutProps {
  points: GeoCompetitorSharePoint[];
  competitors?: GeoCompetitor[];
  action?: ReactNode;
}

export interface CompetitorShareCardProps {
  points: GeoCompetitorSharePoint[];
  companyName: string | null;
  competitors?: GeoCompetitor[];
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
  domain: string | null;
  synonyms?: string[];
  kind?: GeoCompetitorKind;
  color?: string | null;
}

export interface CompetitorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  competitor: GeoCompetitor;
}

export interface GeoCompetitorDeleteInput {
  name: string;
}

export interface GeoCompetitorTimeseriesPoint {
  day: string;
  mentions: number;
  checks: number;
}

export interface GeoCompetitorDetailPoint {
  day: string;
  mentions: number;
  [key: string]: string | number;
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

export interface AddCompetitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export interface AddCompetitorFormValues {
  name: string;
  website: string;
  synonyms: string[];
  kind: GeoCompetitorKind;
}

export interface CompetitorLogoProps {
  name: string;
  domain: string | null;
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
