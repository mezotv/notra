import type { Context } from "hono";
import { getOrganizationIdFromAuth } from "../types/auth";

export function getOrganizationId(c: Context): string | null {
  const auth = c.get("auth");
  return getOrganizationIdFromAuth(auth);
}

export function requireOrganizationId(c: Context): string | Response {
  const orgId = getOrganizationId(c);
  if (!orgId) {
    return c.json(
      { error: "Forbidden: API key must be scoped to an organization" },
      403
    );
  }
  return orgId;
}
