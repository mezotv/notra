import type { Context, Next } from "hono";

import { trackApiRequest } from "../utils/analytics";

export async function apiAnalyticsMiddleware(
  c: Context,
  next: Next
): Promise<void> {
  const startedAt = Date.now();
  await next();
  trackApiRequest(c, Date.now() - startedAt);
}
