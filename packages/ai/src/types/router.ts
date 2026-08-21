import type {
  LanguageModelV3,
  SharedV3ProviderMetadata,
  SharedV3ProviderOptions,
} from "@ai-sdk/provider";
import type { routerProviderOptionsSchema } from "@notra/ai/schemas/router";
import type { ProviderMetadata } from "ai";
import type * as z from "zod";

export type GatewayId = "vercel" | "openrouter";

export type Plan = "free" | "paid";

export type PlanSource = "resolver" | "cache" | "override" | "default";

export type RouteReason =
  | "pinned"
  | "no-org-default"
  | "paid"
  | "free"
  | "fallback";

export type FallbackReason =
  | "not-configured"
  | "unsupported-model"
  | "no-credits"
  | "upstream-error"
  | "non-compliant";

export type RouterErrorCode =
  | "no_compliant_route"
  | "gateway_not_configured"
  | "unsupported_model"
  | "credit_balance"
  | "gateway_unavailable";

/**
 * How strictly zero data retention is required for a request.
 * - `required` (default): fail closed, never send a non-ZDR request.
 * - `preferred`: try with ZDR; when the gateway rejects the ZDR requirement
 *   for this model, retry the same route without it (no-training stays on).
 */
export type ZdrMode = "required" | "preferred";

export interface RouteRequest {
  modelId: string;
  organizationId?: string;
  /** Pin the request to a specific gateway (e.g. provider-defined tools). */
  gateway?: GatewayId;
  zdr?: ZdrMode;
}

export interface RouteDecision {
  gateway: GatewayId;
  /** Model id as requested by the caller (neutral id). */
  requestedModelId: string;
  /** Model id sent to the chosen gateway. */
  modelId: string;
  organizationId?: string;
  plan?: Plan;
  planSource?: PlanSource;
  reason: RouteReason;
  fallbackFrom?: GatewayId;
  fallbackReason?: FallbackReason;
  zdrEnforced: boolean;
}

export interface RouteMetadata {
  gateway: GatewayId;
  requestedModel: string;
  model: string;
  reason: RouteReason;
  plan?: Plan;
  generationId?: string;
  upstreamProvider?: string;
  fallbackFrom?: GatewayId;
  fallbackReason?: FallbackReason;
}

export interface GatewayBalance {
  /** Remaining balance in USD, or null when the gateway does not expose it. */
  balance: number | null;
}

export interface GatewayHealth {
  ok: boolean;
  reason?: string;
}

/**
 * Adapter for a concrete gateway. Adapters are pure: no env access, no
 * logging. They receive everything through their factory config.
 */
export interface GatewayAdapter {
  readonly id: GatewayId;
  /**
   * True when the adapter is configured to enforce zero-data-retention and
   * no-training on every request. Adapters that cannot guarantee this must
   * return false so the router can fail closed.
   */
  readonly enforcesZdr: boolean;
  supportsModel(modelId: string): boolean;
  mapModelId(modelId: string): string;
  createModel(modelId: string): LanguageModelV3;
  /**
   * Translate neutral provider options into the gateway-specific block. The
   * router removes the other gateway's block before delegating.
   */
  buildProviderOptions(
    input: BuildProviderOptionsInput
  ): SharedV3ProviderOptions;
  checkHealth(): Promise<GatewayHealth>;
  getBalance(): Promise<GatewayBalance>;
  extractRouteMetadata(
    providerMetadata: SharedV3ProviderMetadata | undefined
  ): Partial<
    Pick<RouteMetadata, "generationId" | "upstreamProvider" | "model">
  >;
  lookupRouteMetadata?(
    generationId: string
  ): Promise<Partial<Pick<RouteMetadata, "upstreamProvider" | "model">>>;
}

export interface BuildProviderOptionsInput {
  /** Caller provider options, already stripped of the router block. */
  providerOptions: SharedV3ProviderOptions;
  router: RouterProviderOptions;
  /** When true privacy flags may be relaxed by the caller (dev only). */
  allowNonZdr: boolean;
  /**
   * When true the ZDR flag is dropped for this call because the caller
   * requested `zdr: "preferred"` and the gateway rejected ZDR for the model.
   * No-training stays enforced.
   */
  relaxZdr?: boolean;
}

/** Neutral provider options translated by the router for each gateway. */
export type RouterProviderOptions = z.infer<typeof routerProviderOptionsSchema>;

export type ReasoningEffort = NonNullable<
  RouterProviderOptions["reasoning"]
>["effort"];

export interface RouterPolicyConfig {
  defaultGateway: GatewayId;
  paidGateway: GatewayId;
  freeGateway: GatewayId;
  allowNonZdr: boolean;
  crossGatewayFallback: boolean;
}

export interface RouterLogFields {
  [key: string]: string | number | boolean | undefined | null;
}

export interface RouterLogger {
  info(event: string, fields?: RouterLogFields): void;
  warn(event: string, fields?: RouterLogFields): void;
  error(event: string, fields?: RouterLogFields): void;
}

export interface PlanCacheStore {
  get(organizationId: string): Promise<Plan | undefined>;
  set(organizationId: string, plan: Plan, ttlMs: number): Promise<void>;
}

export interface CreditTracker {
  record(gateway: GatewayId, balance: number | null): void;
  markExhausted(gateway: GatewayId): void;
  markUnavailable(gateway: GatewayId, reason: FallbackReason): void;
  isExhausted(gateway: GatewayId): boolean;
  unavailableReason(gateway: GatewayId): FallbackReason | undefined;
  isStale(gateway: GatewayId): boolean;
  snapshot(gateway: GatewayId): CreditSnapshot | undefined;
}

export interface CreditSnapshot {
  balance: number | null;
  checkedAt: number;
}

export interface UnavailableMark {
  reason: FallbackReason;
  until: number;
}

export interface PlanCacheEntry {
  plan: Plan;
  expiresAt: number;
}

export interface ModelRouterConfig {
  adapters: Partial<Record<GatewayId, GatewayAdapter>>;
  resolvePlan: (organizationId: string) => Promise<Plan>;
  policy: RouterPolicyConfig;
  logger?: RouterLogger;
  planCacheTtlMs?: number;
  planCache?: PlanCacheStore;
  creditCheckTtlMs?: number;
  now?: () => number;
}

export interface RoutedModelOptions {
  organizationId?: string;
  gateway?: GatewayId;
  zdr?: ZdrMode;
}

export interface ModelRouter {
  model(modelId: string, options?: RoutedModelOptions): LanguageModelV3;
  resolveRoute(request: RouteRequest): Promise<RouteDecision>;
  assertRouteHasCredits(request: RouteRequest): Promise<RouteDecision>;
  getRouteMetadata(
    providerMetadata: SharedV3ProviderMetadata | undefined
  ): RouteMetadata | undefined;
  enrichRouteMetadata(metadata: RouteMetadata): Promise<RouteMetadata>;
  readonly adapters: Partial<Record<GatewayId, GatewayAdapter>>;
  readonly policy: RouterPolicyConfig;
}

export interface DecideGatewayInput {
  policy: RouterPolicyConfig;
  organizationId?: string;
  plan?: Plan;
  pinned?: GatewayId;
}

export interface GatewayDecision {
  gateway: GatewayId;
  reason: RouteReason;
}

export interface ResolverContext {
  adapters: Partial<Record<GatewayId, GatewayAdapter>>;
  policy: ModelRouterConfig["policy"];
  resolvePlan: ModelRouterConfig["resolvePlan"];
  planCache: PlanCacheStore;
  planCacheTtlMs: number;
  logger: RouterLogger;
  credits: CreditTracker;
}

export interface PlanLookup {
  plan: Plan;
  source: PlanSource;
}

export interface UsableAdapter {
  adapter: GatewayAdapter;
  zdrEnforced: boolean;
}

export interface ResolvedRoute {
  decision: RouteDecision;
  adapter: GatewayAdapter;
  model: LanguageModelV3;
}

export interface RoutedModelContext {
  request: RouteRequest;
  policy: RouterPolicyConfig;
  adapters: Partial<Record<GatewayId, GatewayAdapter>>;
  logger: RouterLogger;
  credits: CreditTracker;
  resolve: (request: RouteRequest) => Promise<RouteDecision>;
}

export interface OpenRouterAdapterConfig {
  apiKey: string;
  headers?: Record<string, string>;
  baseURL?: string;
  fetch?: typeof fetch;
  /** Base URL for account endpoints (`/credits`, `/key`). */
  accountBaseURL?: string;
}

export interface VercelAdapterConfig {
  apiKey?: string;
  headers?: Record<string, string>;
  baseURL?: string;
  fetch?: typeof fetch;
}

export interface RouteUsageSummary {
  /** Route metadata of the last model call (gateway, upstream provider, ...). */
  route?: RouteMetadata;
}

export interface RouteUsageStep {
  providerMetadata?: ProviderMetadata;
}
