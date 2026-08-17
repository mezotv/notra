import type {
  GatewayId,
  RouterMode,
  RouterPolicyConfig,
} from "@notra/ai/router/types";

export const ROUTER_ENV_KEYS = {
  MODE: "AI_ROUTER_MODE",
  DEFAULT_GATEWAY: "AI_ROUTER_DEFAULT_GATEWAY",
  PAID_GATEWAY: "AI_ROUTER_PAID_GATEWAY",
  FREE_GATEWAY: "AI_ROUTER_FREE_GATEWAY",
  ROLLOUT_PERCENT: "AI_ROUTER_OPENROUTER_ROLLOUT_PERCENT",
  ORG_ALLOWLIST: "AI_ROUTER_OPENROUTER_ORG_ALLOWLIST",
  FORCE_GATEWAY: "AI_ROUTER_FORCE_GATEWAY",
  CROSS_GATEWAY_FALLBACK: "AI_ROUTER_CROSS_GATEWAY_FALLBACK",
  ALLOW_NON_ZDR_IN_DEVELOPMENT: "AI_ROUTER_ALLOW_NON_ZDR_IN_DEVELOPMENT",
} as const;

const ROUTER_MODES: readonly RouterMode[] = ["off", "canary", "on"];
const GATEWAYS: readonly GatewayId[] = ["vercel", "openrouter"];
const PERCENT_MIN = 0;
const PERCENT_MAX = 100;

export interface RouterEnv {
  [key: string]: string | undefined;
}

export interface RouterConfigWarning {
  key: string;
  value: string;
  message: string;
}

export interface ParsedRouterConfig {
  policy: RouterPolicyConfig;
  warnings: RouterConfigWarning[];
}

function readTrimmed(env: RouterEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function parseEnum<T extends string>(
  env: RouterEnv,
  key: string,
  allowed: readonly T[],
  fallback: T,
  warnings: RouterConfigWarning[]
): T {
  const raw = readTrimmed(env, key);
  if (!raw) {
    return fallback;
  }
  const normalized = raw.toLowerCase();
  if ((allowed as readonly string[]).includes(normalized)) {
    return normalized as T;
  }
  warnings.push({
    key,
    value: raw,
    message: `expected one of ${allowed.join("|")}, using "${fallback}"`,
  });
  return fallback;
}

function parseOptionalGateway(
  env: RouterEnv,
  key: string,
  warnings: RouterConfigWarning[]
): GatewayId | undefined {
  const raw = readTrimmed(env, key);
  if (!raw) {
    return undefined;
  }
  const normalized = raw.toLowerCase();
  if ((GATEWAYS as readonly string[]).includes(normalized)) {
    return normalized as GatewayId;
  }
  warnings.push({
    key,
    value: raw,
    message: `expected one of ${GATEWAYS.join("|")}, ignoring`,
  });
  return undefined;
}

function parsePercent(
  env: RouterEnv,
  key: string,
  warnings: RouterConfigWarning[]
): number {
  const raw = readTrimmed(env, key);
  if (!raw) {
    return PERCENT_MIN;
  }
  const parsed = Number(raw);
  if (
    Number.isFinite(parsed) &&
    parsed >= PERCENT_MIN &&
    parsed <= PERCENT_MAX
  ) {
    return parsed;
  }
  warnings.push({
    key,
    value: raw,
    message: `expected a number between ${PERCENT_MIN} and ${PERCENT_MAX}, using ${PERCENT_MIN}`,
  });
  return PERCENT_MIN;
}

function parseBoolean(
  env: RouterEnv,
  key: string,
  fallback: boolean,
  warnings: RouterConfigWarning[]
): boolean {
  const raw = readTrimmed(env, key);
  if (!raw) {
    return fallback;
  }
  const normalized = raw.toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  warnings.push({
    key,
    value: raw,
    message: `expected true|false, using ${fallback}`,
  });
  return fallback;
}

function parseAllowlist(env: RouterEnv, key: string): ReadonlySet<string> {
  const raw = readTrimmed(env, key);
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  );
}

/**
 * Parse the router policy from environment variables. Invalid values never
 * throw: they produce a warning and fall back to the safe default so a typo
 * in production config cannot take the AI stack down.
 */
export function parseRouterConfig(env: RouterEnv): ParsedRouterConfig {
  const warnings: RouterConfigWarning[] = [];
  const isDevelopment = env.NODE_ENV === "development";

  const policy: RouterPolicyConfig = {
    mode: parseEnum(env, ROUTER_ENV_KEYS.MODE, ROUTER_MODES, "off", warnings),
    defaultGateway: parseEnum(
      env,
      ROUTER_ENV_KEYS.DEFAULT_GATEWAY,
      GATEWAYS,
      "openrouter",
      warnings
    ),
    paidGateway: parseEnum(
      env,
      ROUTER_ENV_KEYS.PAID_GATEWAY,
      GATEWAYS,
      "vercel",
      warnings
    ),
    freeGateway: parseEnum(
      env,
      ROUTER_ENV_KEYS.FREE_GATEWAY,
      GATEWAYS,
      "openrouter",
      warnings
    ),
    rolloutPercent: parsePercent(
      env,
      ROUTER_ENV_KEYS.ROLLOUT_PERCENT,
      warnings
    ),
    orgAllowlist: parseAllowlist(env, ROUTER_ENV_KEYS.ORG_ALLOWLIST),
    forceGateway: parseOptionalGateway(
      env,
      ROUTER_ENV_KEYS.FORCE_GATEWAY,
      warnings
    ),
    crossGatewayFallback: parseBoolean(
      env,
      ROUTER_ENV_KEYS.CROSS_GATEWAY_FALLBACK,
      true,
      warnings
    ),
    allowNonZdr:
      isDevelopment &&
      parseBoolean(
        env,
        ROUTER_ENV_KEYS.ALLOW_NON_ZDR_IN_DEVELOPMENT,
        false,
        warnings
      ),
  };

  return { policy, warnings };
}
