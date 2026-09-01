import { GEO_DIRECT_GROUNDED_PROVIDERS } from "../constants/geo";
import type {
  GeoGroundedEngine,
  GeoModelCatalog,
  GeoModelGateway,
  GeoZdrMode,
  GeoZdrPolicy,
} from "../types/geo";
import {
  geoDefaultEngines,
  getGeoModelCatalogEntry,
  isGeoEngineZdrCapable,
} from "./geo-model-catalog";

/** Known catalog ids, in catalog order. Unknown ids are dropped. */
export function sortKnownEngines(
  catalog: GeoModelCatalog,
  ids: Iterable<string>
): string[] {
  const selected = new Set(ids);
  return catalog.models
    .filter((model) => selected.has(model.id))
    .map((model) => model.id);
}

/**
 * Maps a project's stored engine selection onto the engines the scan should
 * run. Unknown ids (models that left the catalog) are dropped; `null` or an
 * empty selection falls back to the default set.
 */
export function resolveTrackedEngines(
  catalog: GeoModelCatalog,
  stored: readonly string[] | null | undefined
): string[] {
  const selected = sortKnownEngines(catalog, stored ?? []);
  return selected.length === 0 ? geoDefaultEngines(catalog) : selected;
}

/**
 * Decide how strictly an engine asks the router for zero data retention.
 * - ZDR off for the project → `nonEnforcedMode` ("preferred" by default,
 *   "none" without the add-on).
 * - ZDR on and the model has a ZDR host → "required" (fail closed).
 * - ZDR on, no ZDR host, approved by the user → "preferred".
 * - ZDR on, no ZDR host, not approved → null: the engine must be skipped.
 */
export function resolveGeoZdrMode(
  catalog: GeoModelCatalog,
  engine: string,
  policy: GeoZdrPolicy
): GeoZdrMode | null {
  if (!policy.enforceZdr) {
    return policy.nonEnforcedMode ?? "preferred";
  }
  if (isGeoEngineZdrCapable(catalog, engine)) {
    return "required";
  }
  return policy.nonZdrApprovedEngines.includes(engine) ? "preferred" : null;
}

/**
 * Same decision for a grounded engine. Gateway-served models take their ZDR
 * coverage from the catalog when it lists them; direct vendor SDK engines
 * bypass the router entirely, so under enforced ZDR they run only when the
 * user approved that specific engine.
 */
export function resolveGeoGroundedZdrMode(
  catalog: GeoModelCatalog,
  engine: GeoGroundedEngine,
  policy: GeoZdrPolicy
): GeoZdrMode | null {
  if (!policy.enforceZdr) {
    return policy.nonEnforcedMode ?? "preferred";
  }
  const routed = !GEO_DIRECT_GROUNDED_PROVIDERS.has(engine.provider);
  const coverage = routed
    ? (getGeoModelCatalogEntry(catalog, engine.model)?.zdr ?? engine.zdr)
    : engine.zdr;
  if (coverage !== "none") {
    return "required";
  }
  return policy.nonZdrApprovedEngines.includes(engine.key) ? "preferred" : null;
}

/** Gateway pin for models that only one gateway serves, else undefined. */
export function resolveGeoEngineGateway(
  catalog: GeoModelCatalog,
  engine: string
): GeoModelGateway | undefined {
  const gateways = getGeoModelCatalogEntry(catalog, engine)?.gateways;
  return gateways && gateways.length === 1 ? gateways[0] : undefined;
}

/**
 * Drop every selected engine that cannot run under ZDR. Nothing is swapped
 * for a sibling model; an empty result uses the ZDR-capable default set.
 */
export function applyGeoZdrEngineFallback(
  catalog: GeoModelCatalog,
  selected: readonly string[],
  policy: GeoZdrPolicy
): string[] {
  if (!policy.enforceZdr) {
    return sortKnownEngines(catalog, selected);
  }

  const next = selected.filter(
    (engine) => resolveGeoZdrMode(catalog, engine, policy) !== null
  );

  const sorted = sortKnownEngines(catalog, next);
  if (sorted.length > 0) {
    return sorted;
  }

  return geoDefaultEngines(catalog).filter((engine) =>
    isGeoEngineZdrCapable(catalog, engine)
  );
}
