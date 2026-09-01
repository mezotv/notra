import { redis } from "@notra/ai/utils/redis";
import type { GeoIngestIdentity } from "@notra/geo-core/types/geo";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { Effect } from "effect";

import {
  GEO_INGEST_FIRST_HIT_KEY_PREFIX,
  GEO_INGEST_RECEIVED_SAMPLE_DENOMINATOR,
  GEO_INGEST_RECEIVED_SAMPLE_RATE,
} from "@/constants/geo-analytics";
import { trackServerEvent } from "@/lib/analytics/posthog-server";
import type { GeoIngestAnalyticsInput } from "@/types/analytics/geo-events";

function firstHitKey(identity: GeoIngestIdentity): string {
  return `${GEO_INGEST_FIRST_HIT_KEY_PREFIX}:${identity.organizationId}:${identity.projectId ?? "-"}`;
}

async function claimFirstIngestHit(
  identity: GeoIngestIdentity
): Promise<boolean> {
  const client = redis;
  if (!client) {
    return false;
  }
  const result = await client
    .set(firstHitKey(identity), "1", { nx: true })
    .catch(() => null);
  return result === "OK";
}

export const trackGeoIngestAnalytics = Effect.fn("geoIngest.analytics")(
  function* ({ identity, event }: GeoIngestAnalyticsInput) {
    const scope = {
      organizationId: identity.organizationId,
      projectId: identity.projectId,
    };
    const traits = {
      visitor_type: event.visitor_type,
      agent_family: event.source,
      agent: event.agent,
      purpose: event.category,
      wants_markdown: event.wants_markdown,
    };

    const firstHit = yield* Effect.promise(() => claimFirstIngestHit(identity));
    if (firstHit) {
      trackServerEvent({
        ...scope,
        event: POSTHOG_EVENTS.TRAFFIC_INGEST_FIRST_HIT,
        properties: traits,
      });
    }

    if (Math.random() < GEO_INGEST_RECEIVED_SAMPLE_RATE) {
      trackServerEvent({
        ...scope,
        event: POSTHOG_EVENTS.TRAFFIC_INGEST_RECEIVED,
        properties: {
          ...traits,
          sample_denominator: GEO_INGEST_RECEIVED_SAMPLE_DENOMINATOR,
        },
      });
    }
  }
);
