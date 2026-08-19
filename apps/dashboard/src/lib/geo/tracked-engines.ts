import {
  GEO_ENGINE_LABELS,
  GEO_ENGINES,
  GEO_GROUNDED_ENGINES,
} from "@/constants/geo";
import type {
  GeoOverviewEngine,
  GeoTrackedEngine,
  GeoTrackedEngineStatus,
} from "@/types/geo";

function toStatus(available: boolean, checks: number): GeoTrackedEngineStatus {
  if (!available) {
    return "needs-key";
  }
  return checks > 0 ? "active" : "no-data";
}

export function buildTrackedEngines(
  engines: readonly GeoOverviewEngine[]
): GeoTrackedEngine[] {
  const byEngine = new Map(engines.map((entry) => [entry.engine, entry]));

  const grounded: GeoTrackedEngine[] = GEO_GROUNDED_ENGINES.map((engine) => {
    const row = byEngine.get(engine.key);
    const checks = row?.checks ?? 0;
    return {
      key: engine.key,
      label: engine.label,
      model: engine.model,
      mode: "grounded",
      status: toStatus(engine.isAvailable(), checks),
      envVar: engine.envVar,
      checks,
      mentionRate: row?.mentionRate ?? null,
      lastCheckedAt: row?.lastCheckedAt ?? null,
    };
  });

  const training: GeoTrackedEngine[] = GEO_ENGINES.map((engine) => {
    const row = byEngine.get(engine);
    const checks = row?.checks ?? 0;
    return {
      key: engine,
      label: GEO_ENGINE_LABELS[engine] ?? engine,
      model: engine,
      mode: "training",
      status: toStatus(true, checks),
      envVar: null,
      checks,
      mentionRate: row?.mentionRate ?? null,
      lastCheckedAt: row?.lastCheckedAt ?? null,
    };
  });

  return [...grounded, ...training];
}
