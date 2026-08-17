import type {
  LanguageModelV3,
  SharedV3ProviderMetadata,
  SharedV3ProviderOptions,
} from "@ai-sdk/provider";

export type GatewayId = "vercel" | "openrouter";

export const GATEWAY_IDS: readonly GatewayId[] = ["vercel", "openrouter"];

export type Plan = "free" | "paid";

export type PlanSource = "resolver" | "cache" | "override" | "default";

export type RouterMode = "off" | "canary" | "on";

export type RouteReason =
  | "pinned"
  | "forced"
  | "mode-off"
  | "no-org-default"
  | "paid"
  | "free"
  | "allowlist"
  | "rollout"
  | "rollout-excluded"
  | "fallback";

export type FallbackReason =
  | "not-configured"
  | "unsupported-model"
  | "no-credits"
  | "upstream-error"
  | "non-compliant";

export interface RouteRequest {
  modelId: string;
  organizationId?: string;
  /** Pin the request to a specific gateway (e.g. provider-defined tools). */
  gateway?: GatewayId;
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
  costUsd?: number;
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
    Pick<
      RouteMetadata,
      "generationId" | "upstreamProvider" | "costUsd" | "model"
    >
  >;
  lookupRouteMetadata?(
    generationId: string
  ): Promise<
    Partial<Pick<RouteMetadata, "upstreamProvider" | "costUsd" | "model">>
  >;
}

export interface BuildProviderOptionsInput {
  /** Caller provider options, already stripped of the router block. */
  providerOptions: SharedV3ProviderOptions;
  router: RouterProviderOptions;
  /** When true privacy flags may be relaxed by the caller (dev only). */
  allowNonZdr: boolean;
}

/**
 * Neutral provider options understood by the router. Callers set them under
 * `providerOptions.notraRouter`; the router translates them per gateway.
 */
export interface RouterProviderOptions {
  caching?: "auto";
  fallbackModels?: string[];
  reasoning?: {
    effort?: "low" | "medium" | "high";
    budgetTokens?: number;
  };
}

export const ROUTER_PROVIDER_OPTIONS_KEY = "notraRouter";
export const ROUTER_METADATA_KEY = "notraRouter";

export interface RouterPolicyConfig {
  mode: RouterMode;
  defaultGateway: GatewayId;
  paidGateway: GatewayId;
  freeGateway: GatewayId;
  /** 0..100 — share of free/no-org traffic that goes to `freeGateway` in canary mode. */
  rolloutPercent: number;
  /** Organization ids that always get `freeGateway` in canary mode. */
  orgAllowlist: ReadonlySet<string>;
  forceGateway?: GatewayId;
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
