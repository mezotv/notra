import { Effect } from "effect";
import { GEO_CURSOR_FLAG_KEY } from "@/constants/geo";
import { resolveGeoFlagState } from "@/lib/geo/flag";

export function isCursorEngineEnabledForOrganization(
  organizationId: string
): Promise<boolean> {
  return Effect.runPromise(
    resolveGeoFlagState(GEO_CURSOR_FLAG_KEY, organizationId).pipe(
      Effect.map((state) => state === "enabled")
    )
  );
}
