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

export function authMiddleware(options: AuthOptions = {}) {
  return async (c: Context, next: Next) => {
    const getKey =
      options.getKey ??
      ((c: Context) =>
        c.req.header("Authorization")?.replace("Bearer ", "") ?? null);

    const apiKey = getKey(c);

    if (!apiKey) {
      return c.json({ error: "Missing API key" }, 401);
    }

    try {
      const unkey = new Unkey({ rootKey: c.env.UNKEY_ROOT_KEY });
      const result = await unkey.keys.verifyKey({
        key: apiKey,
        permissions: options.permissions,
      });

      if (!result.data.valid) {
        if (result.data.code === "INSUFFICIENT_PERMISSIONS") {
          return c.json({ error: "Forbidden" }, 403);
        }
        return c.json({ error: result.data.code }, 401);
      }

      c.set("auth", result.data);
      await next();
    } catch {
      return c.json({ error: "Service unavailable" }, 503);
    }
  };
}
