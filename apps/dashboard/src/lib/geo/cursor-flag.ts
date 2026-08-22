import {
  createServerFlagsManager,
  type ServerFlagsManager,
} from "@databuddy/sdk/node";
import { Effect } from "effect";
import {
  GEO_CURSOR_FLAG_CACHE_TTL_MS,
  GEO_CURSOR_FLAG_ERROR_REASON,
  GEO_CURSOR_FLAG_KEY,
  GEO_CURSOR_FLAG_STALE_TIME_MS,
} from "@/constants/geo";
import { GeoCursorFlagEvaluationError } from "@/lib/geo/errors";
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

function resolveGeoCursorFlagState(
  organizationId: string
): Effect.Effect<GeoCursorFlagState> {
  return Effect.gen(function* () {
    const manager = getFlagsManager();
    if (!manager) {
      return "disabled";
    }

    return yield* Effect.tryPromise({
      try: () =>
        manager.getFlag(GEO_CURSOR_FLAG_KEY, {
          organizationId,
          properties: { organizationId },
        }),
      catch: (cause) =>
        new GeoCursorFlagEvaluationError({
          message: "Failed to evaluate the GEO Cursor feature flag",
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

export function isCursorEngineEnabledForOrganization(
  organizationId: string
): Promise<boolean> {
  return Effect.runPromise(
    resolveGeoCursorFlagState(organizationId).pipe(
      Effect.map((state) => state === "enabled")
    )
  );
}
