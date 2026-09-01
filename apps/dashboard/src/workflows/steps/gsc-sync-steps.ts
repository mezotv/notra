import { syncGscSuggestions } from "@notra/geo-core/geo/search-console";
import type { GscSyncResult } from "@notra/geo-core/types/google-search-console";
import { POSTHOG_EVENTS } from "@notra/posthog/events";

import { trackServerEventAndFlush } from "@/lib/analytics/posthog-server";

export async function runGscSyncStep(
  organizationId: string
): Promise<GscSyncResult> {
  "use step";
  const startedAt = Date.now();
  const result = await syncGscSuggestions(organizationId);
  await trackServerEventAndFlush({
    organizationId,
    event: POSTHOG_EVENTS.GSC_SYNC_COMPLETED,
    properties: {
      status: result.status,
      reason: result.reason ?? null,
      keywords: result.keywords ?? 0,
      suggestions_created: result.suggestionsAdded ?? 0,
      duration_ms: Date.now() - startedAt,
    },
  });
  return result;
}
