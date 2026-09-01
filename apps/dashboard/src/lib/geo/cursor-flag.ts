import { GEO_CURSOR_FLAG_KEY } from "@notra/geo-core/constants/geo";
import { Effect } from "effect";

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
