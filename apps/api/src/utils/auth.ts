import type { Context } from "hono";
import { getOrganizationIdFromAuth } from "../types/auth";

export function getOrganizationId(c: Context): string | null {
  const auth = c.get("auth");
  return getOrganizationIdFromAuth(auth);
}
