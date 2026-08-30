import { AGENT_READINESS_FLAG_KEY } from "@notra/geo-core/constants/agent-readiness";
import { Effect } from "effect";

import { resolveGeoFlagState } from "@/lib/geo/flag";

export function isAgentReadinessEnabledForOrganization(
  organizationId: string
): Promise<boolean> {
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve(true);
  }

  return Effect.runPromise(
    resolveGeoFlagState(AGENT_READINESS_FLAG_KEY, organizationId).pipe(
      Effect.map((state) => state === "enabled")
    )
  );
}
