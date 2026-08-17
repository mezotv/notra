import type { SharedV3ProviderMetadata } from "@ai-sdk/provider";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { isModelSupported, toOpenRouterModelId } from "../model-ids";
import { buildOpenRouterProviderOptions } from "../provider-options";
import type { GatewayAdapter, GatewayBalance, GatewayHealth } from "../types";

export interface OpenRouterAdapterConfig {
  apiKey: string;
  headers?: Record<string, string>;
  baseURL?: string;
  fetch?: typeof fetch;
  /** Base URL for account endpoints (`/credits`, `/key`). */
  accountBaseURL?: string;
}

const DEFAULT_ACCOUNT_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Privacy guardrails applied at provider level (belt) in addition to the
 * per-request provider options (braces) built by buildOpenRouterProviderOptions.
 */
export const OPENROUTER_PRIVACY_PROVIDER_ROUTING = {
  zdr: true,
  data_collection: "deny",
} as const;

type OpenRouterClient = ReturnType<typeof createOpenRouter>;

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function createOpenRouterAdapter(
  config: OpenRouterAdapterConfig
): GatewayAdapter {
  let client: OpenRouterClient | undefined;
  const fetchImpl = config.fetch ?? fetch;
  const accountBaseURL = config.accountBaseURL ?? DEFAULT_ACCOUNT_BASE_URL;

  const getClient = (): OpenRouterClient => {
    client ??= createOpenRouter({
      apiKey: config.apiKey,
      headers: config.headers,
      baseURL: config.baseURL,
      fetch: config.fetch,
      compatibility: "strict",
      extraBody: { provider: OPENROUTER_PRIVACY_PROVIDER_ROUTING },
    });
    return client;
  };

  const accountRequest = async (path: string): Promise<unknown> => {
    const response = await fetchImpl(`${accountBaseURL}${path}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    if (!response.ok) {
      throw new Error(
        `OpenRouter ${path} responded with ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  };

  const getBalance = async (): Promise<GatewayBalance> => {
    const payload = (await accountRequest("/credits")) as {
      data?: { total_credits?: unknown; total_usage?: unknown };
    };
    const totalCredits = readNumber(payload.data?.total_credits);
    const totalUsage = readNumber(payload.data?.total_usage);
    if (totalCredits === undefined || totalUsage === undefined) {
      return { balance: null };
    }
    return { balance: totalCredits - totalUsage };
  };

  return {
    id: "openrouter",
    enforcesZdr: true,
    supportsModel: (modelId) => isModelSupported("openrouter", modelId),
    mapModelId: toOpenRouterModelId,
    createModel: (modelId) =>
      getClient().chat(toOpenRouterModelId(modelId), {
        usage: { include: true },
        provider: { ...OPENROUTER_PRIVACY_PROVIDER_ROUTING },
      }),
    buildProviderOptions: buildOpenRouterProviderOptions,
    async checkHealth(): Promise<GatewayHealth> {
      try {
        await accountRequest("/key");
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          reason: error instanceof Error ? error.message : "unknown error",
        };
      }
    },
    getBalance,
    extractRouteMetadata(
      providerMetadata: SharedV3ProviderMetadata | undefined
    ) {
      const openrouter = providerMetadata?.openrouter;
      if (!openrouter || typeof openrouter !== "object") {
        return {};
      }
      const record = openrouter as Record<string, unknown>;
      const usage =
        typeof record.usage === "object" && record.usage !== null
          ? (record.usage as Record<string, unknown>)
          : undefined;
      return {
        upstreamProvider:
          typeof record.provider === "string" && record.provider.length > 0
            ? record.provider
            : undefined,
        costUsd: readNumber(usage?.cost),
      };
    },
  };
}
