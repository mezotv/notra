import type { LanguageModelV3CallOptions } from "@ai-sdk/provider";
import type {
  GatewayAdapter,
  GatewayId,
  ModelRouterConfig,
  Plan,
  RouterLogFields,
  RouterPolicyConfig,
} from "@notra/ai/types/router";

export interface RecordedRouterCall {
  gateway: GatewayId;
  modelId: string;
  options: LanguageModelV3CallOptions;
}

export interface FakeAdapterOptions {
  id: GatewayId;
  enforcesZdr?: boolean;
  supportedModels?: (modelId: string) => boolean;
  balance?: number | null;
  onCall?: (call: RecordedRouterCall) => void;
  upstreamProvider?: string;
}

export interface FakeAdapter extends GatewayAdapter {
  calls: RecordedRouterCall[];
  balanceCalls: number;
}

export interface RouterTestLogEntry {
  level: "info" | "warn" | "error";
  event: string;
  fields?: RouterLogFields;
}

export interface TestRouterOptions {
  vercel?: FakeAdapter | null;
  openrouter?: FakeAdapter | null;
  plans?: Record<string, Plan>;
  resolvePlan?: ModelRouterConfig["resolvePlan"];
  policy?: Partial<RouterPolicyConfig>;
  now?: () => number;
  planCacheTtlMs?: number;
  creditCheckTtlMs?: number;
}
