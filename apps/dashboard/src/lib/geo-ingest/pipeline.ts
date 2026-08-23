import { ingestGeoTrafficEvents } from "@notra/analytics/tinybird/client";
import type { GeoTrafficEventRow } from "@notra/analytics/tinybird/datasources";
import type { GeoRequestPayload } from "@usenotra/geo";
import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { GEO_INGEST_BEARER_PREFIX } from "@/constants/geo";
import { classifyVisitor } from "@/lib/geo-ingest/classify-visitor";
import {
  GeoIngestFailedError,
  GeoIngestInvalidPayloadError,
  GeoIngestInvalidTokenError,
  GeoIngestMissingTokenError,
  GeoIngestRateLimitedError,
  GeoIngestUnparseableUrlError,
} from "@/lib/geo-ingest/errors";
import { buildGeoTrafficEvent, toCapturedDate } from "@/lib/geo-ingest/event";
import { isGeoIngestIdentityActive } from "@/lib/geo-ingest/identity";
import { resolveJourneyId } from "@/lib/geo-ingest/journey";
import { verifyGeoIngestToken } from "@/lib/geo-ingest/token";
import { geoRequestPayloadSchema } from "@/schemas/geo";
import type { GeoIngestIdentity } from "@/types/geo";
import { ratelimit } from "@/utils/ratelimit";

const authenticate = Effect.fn("geoIngest.authenticate")(function* (
  request: NextRequest
) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith(GEO_INGEST_BEARER_PREFIX)
    ? header.slice(GEO_INGEST_BEARER_PREFIX.length).trim()
    : "";

  if (token.length === 0) {
    return yield* Effect.fail(new GeoIngestMissingTokenError({}));
  }

  const identity = verifyGeoIngestToken(token);
  if (!identity) {
    return yield* Effect.fail(new GeoIngestInvalidTokenError({}));
  }

  const active = yield* Effect.promise(() =>
    isGeoIngestIdentityActive(identity)
  );
  if (!active) {
    return yield* Effect.fail(new GeoIngestInvalidTokenError({}));
  }

  return identity;
});

const enforceRateLimit = Effect.fn("geoIngest.rateLimit")(function* (
  organizationId: string
) {
  const { success } = yield* Effect.promise(() =>
    ratelimit.geoIngest.limit(organizationId)
  );
  if (!success) {
    return yield* Effect.fail(
      new GeoIngestRateLimitedError({ organizationId })
    );
  }
});

const readPayload = Effect.fn("geoIngest.readPayload")(function* (
  request: NextRequest
) {
  const body = yield* Effect.promise(() => request.json().catch(() => null));
  const parsed = geoRequestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return yield* Effect.fail(
      new GeoIngestInvalidPayloadError({ issues: parsed.error.issues })
    );
  }
  return parsed.data;
});

const parseUrl = Effect.fn("geoIngest.parseUrl")(function* (value: string) {
  return yield* Effect.try({
    try: () => new URL(value),
    catch: () => new GeoIngestUnparseableUrlError({ url: value }),
  });
});

const buildEvent = Effect.fn("geoIngest.buildEvent")(function* (
  identity: GeoIngestIdentity,
  payload: GeoRequestPayload
) {
  const url = yield* parseUrl(payload.url);
  const classification = classifyVisitor({
    userAgent: payload.userAgent,
    referer: payload.referer,
    accept: payload.accept,
    signals: payload.signals,
  });
  const capturedAt = toCapturedDate(payload.timestamp);
  const journey = resolveJourneyId({
    url,
    source: classification.source,
    ip: payload.ip,
    capturedAt,
    visitorType: classification.visitorType,
    category: classification.category,
  });

  return buildGeoTrafficEvent({
    organizationId: identity.organizationId,
    projectId: identity.projectId,
    payload,
    url,
    capturedAt,
    classification,
    journey,
  });
});

const ingestEvent = Effect.fn("geoIngest.ingest")(function* (
  event: GeoTrafficEventRow
) {
  yield* Effect.tryPromise({
    try: () => ingestGeoTrafficEvents([event]),
    catch: (cause) => new GeoIngestFailedError({ cause }),
  });
});

export const runGeoIngest = Effect.fn("geoIngest.run")(function* (
  request: NextRequest
) {
  const identity = yield* authenticate(request);
  yield* enforceRateLimit(identity.organizationId);
  const payload = yield* readPayload(request);
  const event = yield* buildEvent(identity, payload);
  yield* ingestEvent(event);
});
