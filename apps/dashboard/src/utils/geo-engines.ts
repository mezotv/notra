import {
  GEO_DEFAULT_ENGINES,
  GEO_ENGINE_SET,
  GEO_ENGINES,
  type GeoEngineId,
} from "@/constants/geo";
import {
  GEO_MODEL_PROVIDERS,
  geoModelsForProvider,
  getGeoModelCatalogEntry,
  isGeoEngineZdrCapable,
} from "@/constants/geo-model-catalog";
import type {
  GeoModelGateway,
  GeoModelProviderId,
  GeoResolvedScanEngine,
  GeoZdrMode,
  GeoZdrPolicy,
} from "@/types/geo";

/** Known catalog ids, in GEO_ENGINES order. Unknown ids are dropped. */
export function sortKnownEngines(ids: Iterable<string>): GeoEngineId[] {
  const selected = new Set<string>();
  for (const engine of ids) {
    if (GEO_ENGINE_SET.has(engine)) {
      selected.add(engine);
    }
  }
  return GEO_ENGINES.filter((engine) => selected.has(engine));
}

/**
 * Maps a project's stored engine selection onto the engines the scan should
 * run. Unknown ids (e.g. models that were removed from GEO_ENGINES) are
 * dropped; `null` or an empty selection falls back to the default set.
 */
export function resolveTrackedEngines(
  stored: readonly string[] | null | undefined
): GeoEngineId[] {
  const selected = sortKnownEngines(stored ?? []);
  return selected.length === 0 ? [...GEO_DEFAULT_ENGINES] : selected;
}

/**
 * Decide how strictly an engine asks the router for zero data retention.
 * - ZDR off for the project → "preferred" (try ZDR, accept a non-ZDR host).
 * - ZDR on and the model has a ZDR host → "required" (fail closed).
 * - ZDR on, no ZDR host, approved by the user → "preferred".
 * - ZDR on, no ZDR host, not approved → null: the engine must be skipped.
 */
export function resolveGeoZdrMode(
  engine: string,
  policy: GeoZdrPolicy
): GeoZdrMode | null {
  if (!policy.enforceZdr) {
    return "preferred";
  }
  if (isGeoEngineZdrCapable(engine)) {
    return "required";
  }
  return policy.nonZdrApprovedEngines.includes(engine) ? "preferred" : null;
}

/** Gateway pin for models that only one gateway serves, else undefined. */
export function resolveGeoEngineGateway(
  engine: string
): GeoModelGateway | undefined {
  const gateways = getGeoModelCatalogEntry(engine)?.gateways;
  return gateways && gateways.length === 1 ? gateways[0] : undefined;
}

/**
 * Models a provider switch turns on. When `requireZdr` is set, non-ZDR
 * models are skipped so the provider lands on a host that can actually run.
 */
export function enginesForProviderToggle(
  providerId: GeoModelProviderId,
  requireZdr: boolean
): GeoEngineId[] {
  const models = geoModelsForProvider(providerId);
  const defaults = models.filter((model) => model.default);
  const pool = defaults.length > 0 ? defaults : models.slice(0, 1);
  const chosen = requireZdr
    ? pool.filter((model) => model.zdr !== "none")
    : pool;
  if (chosen.length > 0) {
    return sortKnownEngines(chosen.map((model) => model.id));
  }
  if (!requireZdr) {
    return [];
  }
  const sibling = models.find((model) => model.zdr !== "none");
  return sibling ? sortKnownEngines([sibling.id]) : [];
}

/**
 * Rewrite a selection so every remaining engine can run under ZDR.
 * Non-ZDR picks fall back to a ZDR sibling on the same provider; providers
 * with no ZDR host drop out. An empty result uses the default ZDR set.
 */
export function applyGeoZdrEngineFallback(
  selected: readonly string[],
  policy: GeoZdrPolicy
): GeoEngineId[] {
  if (!policy.enforceZdr) {
    return sortKnownEngines(selected);
  }

  const next: string[] = [];
  for (const provider of GEO_MODEL_PROVIDERS) {
    const models = geoModelsForProvider(provider.id);
    const selectedHere = models.filter((model) => selected.includes(model.id));
    if (selectedHere.length === 0) {
      continue;
    }

    const runnable = selectedHere.filter(
      (model) => resolveGeoZdrMode(model.id, policy) !== null
    );
    if (runnable.length > 0) {
      next.push(...runnable.map((model) => model.id));
      continue;
    }

    next.push(...enginesForProviderToggle(provider.id, true));
  }

  const sorted = sortKnownEngines(next);
  if (sorted.length > 0) {
    return sorted;
  }

  return sortKnownEngines(
    GEO_DEFAULT_ENGINES.filter((engine) => isGeoEngineZdrCapable(engine))
  );
}

/**
 * Pick the engine a scan should call. If the stored id cannot run under
 * ZDR, fall back to a ZDR-capable sibling on the same provider that is not
 * already in `occupied`. Returns null when nothing can run.
 */
export function resolveGeoScanEngine(
  engine: string,
  policy: GeoZdrPolicy,
  occupied: ReadonlySet<string>
): GeoResolvedScanEngine | null {
  const direct = resolveGeoZdrMode(engine, policy);
  if (direct !== null) {
    return { engine, zdr: direct };
  }

  const entry = getGeoModelCatalogEntry(engine);
  if (!entry) {
    return null;
  }

  const models = geoModelsForProvider(entry.provider);
  const sibling =
    models.find(
      (model) =>
        model.default && model.zdr !== "none" && !occupied.has(model.id)
    ) ??
    models.find((model) => model.zdr !== "none" && !occupied.has(model.id));
  if (!sibling) {
    return null;
  }

  const zdr = resolveGeoZdrMode(sibling.id, policy);
  if (zdr === null) {
    return null;
  }

  return { engine: sibling.id, zdr };
}
