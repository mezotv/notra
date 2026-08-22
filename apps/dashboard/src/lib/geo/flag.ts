import {
  createServerFlagsManager,
  type ServerFlagsManager,
} from "@databuddy/sdk/node";
import { Effect } from "effect";
import {
  GEO_CURSOR_FLAG_CACHE_TTL_MS,
  GEO_CURSOR_FLAG_ERROR_REASON,
  GEO_CURSOR_FLAG_STALE_TIME_MS,
  GEO_WRITER_FLAG_KEY,
} from "@/constants/geo";
import {
  GeoCursorFlagEvaluationError,
  GeoWriterDisabledError,
} from "@/lib/geo/errors";
import type { GeoCursorFlagState } from "@/types/geo";

const clientId = process.env.NEXT_PUBLIC_DATABUDDY_DASHBOARD_WEBSITE_ID ?? "";

let cachedManager: ServerFlagsManager | null = null;

function getFlagsManager(): ServerFlagsManager | null {
  if (clientId.length === 0) {
    return null;
  }

  if (!cachedManager) {
    cachedManager = createServerFlagsManager({
      clientId,
      autoFetch: false,
      cacheTtl: GEO_CURSOR_FLAG_CACHE_TTL_MS,
      staleTime: GEO_CURSOR_FLAG_STALE_TIME_MS,
      skipStorage: true,
    });
  }

  return cachedManager;
}

export function resolveGeoFlagState(
  flagKey: string,
  organizationId: string
): Effect.Effect<GeoCursorFlagState> {
  return Effect.gen(function* () {
    const manager = getFlagsManager();
    if (!manager) {
      return "disabled";
    }

    return yield* Effect.tryPromise({
      try: () =>
        manager.getFlag(flagKey, {
          organizationId,
          properties: { organizationId },
        }),
      catch: (cause) =>
        new GeoCursorFlagEvaluationError({
          message: `Failed to evaluate the GEO feature flag "${flagKey}"`,
          cause,
        }),
    }).pipe(
      Effect.map((result): GeoCursorFlagState => {
        if (result.reason === GEO_CURSOR_FLAG_ERROR_REASON) {
          return "unavailable";
        }
        return result.enabled ? "enabled" : "disabled";
      }),
      Effect.catch(() => Effect.succeed<GeoCursorFlagState>("unavailable"))
    );
  });
}

/**
 * The GEO writer is visible in development regardless of the flag so the
 * flow can be exercised locally without a Databuddy project.
 */
function isGeoWriterEnabledForOrganization(
  organizationId: string
): Effect.Effect<boolean> {
  if (process.env.NODE_ENV === "development") {
    return Effect.succeed(true);
  }
  return resolveGeoFlagState(GEO_WRITER_FLAG_KEY, organizationId).pipe(
    Effect.map((state) => state === "enabled")
  );
}

export const requireWriterEnabled = Effect.fn("geo.writer.flag")(function* (
  organizationId: string
) {
  const enabled = yield* isGeoWriterEnabledForOrganization(organizationId);
  if (!enabled) {
    return yield* Effect.fail(new GeoWriterDisabledError({ organizationId }));
  }
});
