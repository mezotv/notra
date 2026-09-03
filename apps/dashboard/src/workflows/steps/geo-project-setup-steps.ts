import { generateGeoFromWebsite } from "@notra/geo-core/geo/discover";
import { requireBrandIdentity } from "@notra/geo-core/geo/projects";
import { Effect } from "effect";

import { geoCoreDashboardLayer } from "@/lib/geo/configure";
import type { GeoProjectSetupPayload } from "@/types/geo";

export async function runGeoProjectSetupStep(
  payload: GeoProjectSetupPayload
): Promise<void> {
  "use step";

  await Effect.runPromise(
    requireBrandIdentity(payload.organizationId, payload.brandSettingsId).pipe(
      Effect.flatMap((identity) =>
        generateGeoFromWebsite(
          {
            organizationId: payload.organizationId,
            projectId: payload.projectId,
          },
          identity.websiteUrl
        )
      ),
      Effect.provide(geoCoreDashboardLayer)
    )
  );
}
