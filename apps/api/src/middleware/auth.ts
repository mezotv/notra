import type { createDb } from "@notra/db/drizzle-http";
import { Unkey } from "@unkey/api";
import type { V2KeysVerifyKeyResponseData } from "@unkey/api/models/components";
import type { Context, Next } from "hono";

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

type AuthResult =
  | { success: true; auth: V2KeysVerifyKeyResponseData }
  | { success: false; error: string; status: 401 | 403 | 503 };

export async function verifyRequestAuth(
  c: Context,
  options: AuthOptions = {}
): Promise<AuthResult> {
  const getKey =
    options.getKey ??
    ((c: Context) =>
      c.req.header("Authorization")?.replace("Bearer ", "") ?? null);

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
      return c.json({ error: authResult.error }, authResult.status);
    }

    await next();
  };
}
