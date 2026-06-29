import type { createDb } from "@notra/db/drizzle-http";
import { Unkey } from "@unkey/api";
import type { Context, Next } from "hono";
import {
  createRemoteJWKSet,
  type JWTPayload,
  errors as joseErrors,
  jwtVerify,
} from "jose";
import {
  LEGACY_API_READ_SCOPE,
  LEGACY_API_WRITE_SCOPE,
} from "../constants/oauth-scopes";
import type { AuthData } from "../types/auth";
import {
  API_URL,
  AUTH_GUIDE_URL,
  RESOURCE_METADATA_URL,
} from "../utils/agent-discovery";

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthData;
    db: ReturnType<typeof createDb>;
  }
}

interface AuthOptions {
  getKey?: (c: Context) => string | null;
  legacyPermissions?: string[];
  permissions?: string;
}

const BEARER_HEADER_REGEX = /^Bearer\s+(.+)$/i;
const DEFAULT_OAUTH_BASE_URL = "https://app.usenotra.com";
const OAUTH_BASE_PATH = "/api/auth";
const OAUTH_JWKS_PATH = `${OAUTH_BASE_PATH}/jwks`;
const TRAILING_SLASH_REGEX = /\/+$/;
const OAUTH_AUDIENCES = [
  API_URL,
  "https://mcp.usenotra.com",
  "https://mcp.usenotra.com/mcp",
] as const;
const SCOPE_SEPARATOR_REGEX = /\s+/;
const remoteJwksByUrl = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

function extractBearerToken(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (!header) {
    return null;
  }

  const match = BEARER_HEADER_REGEX.exec(header.trim());
  return match?.[1]?.trim() || null;
}

type AuthResult =
  | { success: true; auth: AuthData }
  | { success: false; error: string; status: 401 | 403 | 503 };

function getOAuthIssuer(c: Context) {
  const baseUrl = (c.env.BETTER_AUTH_URL ?? DEFAULT_OAUTH_BASE_URL).replace(
    TRAILING_SLASH_REGEX,
    ""
  );
  return baseUrl.endsWith(OAUTH_BASE_PATH)
    ? baseUrl
    : `${baseUrl}${OAUTH_BASE_PATH}`;
}

function getOAuthJwksUrl(c: Context) {
  return new URL(OAUTH_JWKS_PATH, getOAuthIssuer(c)).toString();
}

function getRemoteJwks(jwksUrl: string): ReturnType<typeof createRemoteJWKSet> {
  const cached = remoteJwksByUrl.get(jwksUrl);
  if (cached) {
    return cached;
  }

  const jwks = createRemoteJWKSet(new URL(jwksUrl), {
    cacheMaxAge: 10 * 60 * 1000,
    cooldownDuration: 30_000,
  });
  remoteJwksByUrl.set(jwksUrl, jwks);
  return jwks;
}

function decodeJsonSegment(segment: string): unknown {
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
}

function looksLikeJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [headerSegment, payloadSegment] = parts as [string, string, string];
  const header = decodeJsonSegment(headerSegment);
  const payload = decodeJsonSegment(payloadSegment);
  return (
    typeof header === "object" &&
    header !== null &&
    typeof payload === "object" &&
    payload !== null
  );
}

function extractScopes(payload: JWTPayload): string[] {
  const rawScopes = payload.scope ?? payload.scp ?? payload.scopes;
  if (typeof rawScopes === "string") {
    return rawScopes.split(SCOPE_SEPARATOR_REGEX).filter(Boolean);
  }
  if (Array.isArray(rawScopes)) {
    return rawScopes.filter(
      (scope): scope is string => typeof scope === "string" && scope.length > 0
    );
  }
  return [];
}

function hasRequiredScope(scopes: string[], requiredScope?: string) {
  if (!requiredScope) {
    return true;
  }

  if (scopes.includes(requiredScope) || scopes.includes("*")) {
    return true;
  }

  if (scopes.includes(LEGACY_API_WRITE_SCOPE)) {
    return true;
  }

  return (
    requiredScope.endsWith(".read") && scopes.includes(LEGACY_API_READ_SCOPE)
  );
}

async function verifyOAuthToken(
  c: Context,
  token: string,
  requiredScope?: string
): Promise<AuthResult> {
  try {
    const { payload } = await jwtVerify(
      token,
      getRemoteJwks(getOAuthJwksUrl(c)),
      {
        audience: [...OAUTH_AUDIENCES],
        issuer: getOAuthIssuer(c),
      }
    );
    const scopes = extractScopes(payload);
    const organizationId = payload.organizationId;

    if (!payload.sub) {
      return { success: false, error: "Missing OAuth subject", status: 401 };
    }

    if (!(typeof organizationId === "string" && organizationId.length > 0)) {
      return {
        success: false,
        error: "Missing OAuth organization",
        status: 401,
      };
    }

    if (!hasRequiredScope(scopes, requiredScope)) {
      return { success: false, error: "Forbidden", status: 403 };
    }

    return {
      success: true,
      auth: {
        type: "oauth",
        keyId: `oauth:${payload.sub}:${organizationId}`,
        userId: payload.sub,
        scopes,
        identity: { externalId: organizationId },
      },
    };
  } catch (error) {
    if (error instanceof joseErrors.JOSEError) {
      return { success: false, error: error.code, status: 401 };
    }

    return {
      success: false,
      error: "OAuth verification unavailable",
      status: 503,
    };
  }
}

function getRecovery(status: 401 | 403 | 503) {
  if (status === 401) {
    return `Send Authorization: Bearer <NOTRA_API_KEY>. See ${AUTH_GUIDE_URL} for agent credential discovery.`;
  }

  if (status === 403) {
    return "Request a key with the required scope for this endpoint, then retry after verifying whether the previous mutation completed.";
  }

  return "The authentication service is temporarily unavailable. Retry with exponential backoff.";
}

async function verifyRequestAuth(
  c: Context,
  options: AuthOptions = {}
): Promise<AuthResult> {
  const getKey = options.getKey ?? extractBearerToken;
  const apiKey = getKey(c);

  if (!apiKey) {
    return { success: false, error: "Missing API key", status: 401 };
  }

  if (looksLikeJwt(apiKey)) {
    const oauthResult = await verifyOAuthToken(c, apiKey, options.permissions);
    if (oauthResult.success) {
      c.set("auth", oauthResult.auth);
    }
    return oauthResult;
  }

  try {
    const unkey = new Unkey({ rootKey: c.env.UNKEY_ROOT_KEY });
    const permissionsToTry = [
      options.permissions,
      ...(options.legacyPermissions ?? []),
    ].filter(
      (permission, index, permissions): permission is string =>
        typeof permission === "string" &&
        permission.length > 0 &&
        permissions.indexOf(permission) === index
    );
    let result = await unkey.keys.verifyKey({
      key: apiKey,
      ...(permissionsToTry[0] ? { permissions: permissionsToTry[0] } : {}),
    });

    for (const permission of permissionsToTry.slice(1)) {
      if (
        result.data.valid ||
        result.data.code !== "INSUFFICIENT_PERMISSIONS"
      ) {
        break;
      }

      result = await unkey.keys.verifyKey({
        key: apiKey,
        permissions: permission,
      });
    }

    if (!result.data.valid) {
      if (result.data.code === "INSUFFICIENT_PERMISSIONS") {
        return { success: false, error: "Forbidden", status: 403 };
      }
      return { success: false, error: result.data.code, status: 401 };
    }

    if (!result.data.identity?.externalId) {
      return {
        success: false,
        error: "Missing or invalid API key",
        status: 401,
      };
    }

    c.set("auth", result.data);
    return { success: true, auth: result.data };
  } catch {
    return { success: false, error: "Service unavailable", status: 503 };
  }
}

export function authMiddleware(options: AuthOptions = {}) {
  return async (c: Context, next: Next) => {
    const authResult = await verifyRequestAuth(c, options);
    if (!authResult.success) {
      if (authResult.status === 401) {
        c.header(
          "WWW-Authenticate",
          `Bearer resource_metadata="${RESOURCE_METADATA_URL}"`
        );
      }

      return c.json(
        {
          error: authResult.error,
          code: authResult.error.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
          recovery: getRecovery(authResult.status),
        },
        authResult.status
      );
    }

    await next();
  };
}
