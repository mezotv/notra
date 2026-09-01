import {
  createServerFlagsManager,
  type ServerFlagsManager,
} from "@databuddy/sdk/node";
import {
  GEO_CURSOR_FLAG_CACHE_TTL_MS,
  GEO_CURSOR_FLAG_ERROR_REASON,
  GEO_CURSOR_FLAG_STALE_TIME_MS,
} from "@notra/geo-core/constants/geo";
import { GeoCursorFlagEvaluationError } from "@notra/geo-core/geo/errors";
import { Effect } from "effect";

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
