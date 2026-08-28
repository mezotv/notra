import { Effect } from "effect";

import { AGENT_READINESS_FLAG_KEY } from "@/constants/agent-readiness";
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
