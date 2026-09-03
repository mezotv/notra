import type { createDb } from "@notra/db/drizzle";
import { isProjectInOrganization } from "@notra/db/utils/projects";
import { loadGeoModelCatalog } from "@notra/geo-core/geo/model-catalog";
import {
  isSupportedGeoLanguage,
  SUPPORTED_GEO_LANGUAGES,
} from "@notra/geo-core/utils/geo-language-rows";
import { Effect } from "effect";
import type { Context } from "hono";

import { geoCoreApiLayer } from "../lib/geo/configure";
import type { GeoFailure } from "../types/geo";

type DbClient = ReturnType<typeof createDb>;

/**
 * Turns a normalized GEO failure into a typed JSON response.
 *
 * The switch is what makes the status literal again — `c.json(body, status)`
 * with a union status does not narrow, and every GEO route declares each of
 * these responses.
 */
export function geoErrorResponse(c: Context, failure: GeoFailure) {
  switch (failure.status) {
    case 400:
      return c.json({ error: failure.error }, 400);
    case 402:
      return c.json({ error: failure.error }, 402);
    case 404:
      return c.json({ error: failure.error }, 404);
    case 409:
      return c.json({ error: failure.error }, 409);
    case 503:
      return c.json({ error: failure.error }, 503);
    default:
      return c.json({ error: failure.error }, 500);
  }
}

function unknownEntries(
  values: readonly string[],
  isKnown: (value: string) => boolean
): string[] {
  return [...new Set(values.filter((value) => !isKnown(value)))];
}

/**
 * Rejects engine ids and languages the storage layer would silently rewrite.
 *
 * `resolveTrackedEngines` drops ids that are not in the catalog and falls back
 * to the *full* default engine set once nothing known is left, so a single
 * typo could turn a one-engine scan into a five-engine one. `trackedGeoLanguages`
 * coerces an unknown language to English the same way. Both used to answer 200,
 * so the caller never learned its selection had been replaced.
 *
 * Engines are checked against the catalog this organization can see. That is
 * the same set `GET .../geo/settings` reports (it maps stored engines through
 * `resolveTrackedEngines`), so a read-modify-write round trip always passes.
 * Engines that are stored but currently hidden from the organization are
 * preserved by `upsertGeoSettings` itself and are deliberately not required in
 * the payload. `nonZdrApprovedEngines` is *not* validated here: the GET
 * response returns it straight from the row, hidden ids included, so rejecting
 * them would break that same round trip.
 *
 * Returns the error message for a 400, or `null` when the selection is usable.
 */
export async function findGeoSelectionError({
  organizationId,
  engines,
  languages,
}: {
  organizationId: string;
  engines: readonly string[];
  languages: readonly string[];
}): Promise<string | null> {
  const catalog = await Effect.runPromise(
    loadGeoModelCatalog(organizationId).pipe(Effect.provide(geoCoreApiLayer))
  );
  const catalogIds = catalog.models.map((model) => model.id);
  const knownEngines = new Set(catalogIds);

  const rejectedEngines = unknownEntries(engines, (engine) =>
    knownEngines.has(engine)
  );
  if (rejectedEngines.length > 0) {
    return `Unknown engines: ${rejectedEngines.join(", ")}. Supported engines: ${catalogIds.join(", ")}`;
  }

  const rejectedLanguages = unknownEntries(languages, isSupportedGeoLanguage);
  if (rejectedLanguages.length > 0) {
    return `Unknown languages: ${rejectedLanguages.join(", ")}. Supported languages: ${SUPPORTED_GEO_LANGUAGES.join(", ")}`;
  }

  return null;
}

/** Confirms the project exists inside the caller's organization. */
export async function projectBelongsToOrganization(
  db: DbClient,
  organizationId: string,
  projectId: string
): Promise<boolean> {
  return isProjectInOrganization(organizationId, projectId, db);
}
