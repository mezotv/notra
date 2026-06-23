import type { createDb } from "@notra/db/drizzle-http";
import { Unkey } from "@unkey/api";
import type { V2KeysVerifyKeyResponseData } from "@unkey/api/models/components";
import type { Context, Next } from "hono";
import {
  AUTH_GUIDE_URL,
  RESOURCE_METADATA_URL,
} from "../utils/agent-discovery";

declare module "hono" {
  interface ContextVariableMap {
    auth: V2KeysVerifyKeyResponseData;
    db: ReturnType<typeof createDb>;
  }
}

interface AuthOptions {
  getKey?: (c: Context) => string | null;
  permissions?: string;
}

const BEARER_HEADER_REGEX = /^Bearer\s+(.+)$/i;

function extractBearerToken(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (!header) {
    return null;
  }

  const match = BEARER_HEADER_REGEX.exec(header.trim());
  return match?.[1]?.trim() || null;
}

type AuthResult =
  | { success: true; auth: V2KeysVerifyKeyResponseData }
  | { success: false; error: string; status: 401 | 403 | 503 };

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

  try {
    const unkey = new Unkey({ rootKey: c.env.UNKEY_ROOT_KEY });
    const result = await unkey.keys.verifyKey({
      key: apiKey,
      permissions: options.permissions,
    });

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
