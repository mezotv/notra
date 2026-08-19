import { GEO_MEMORY_LABEL, GEO_SEARCH_LABEL } from "@/constants/geo";
import type {
  GeoTrackedEngine,
  GeoTrackedEngineMode,
  GeoTrackedEngineStatus,
} from "@/types/geo";

export function formatEngineMode(mode: GeoTrackedEngineMode): string {
  return mode === "grounded" ? GEO_SEARCH_LABEL : GEO_MEMORY_LABEL;
}

export function formatEngineStatus(status: GeoTrackedEngineStatus): string {
  if (status === "active") {
    return "Scanning";
  }
  if (status === "needs-key") {
    return "Needs API key";
  }
  return "No data yet";
}

export function trackedEngineStatusTone(
  status: GeoTrackedEngineStatus
): string {
  if (status === "active") {
    return "text-emerald-600 text-sm dark:text-emerald-400";
  }
  if (status === "needs-key") {
    return "text-amber-600 text-sm dark:text-amber-400";
  }
  return "text-muted-foreground text-sm";
}

export function describeEngineStatus(
  engine: Pick<GeoTrackedEngine, "status" | "envVar">
): string {
  if (engine.status === "needs-key") {
    return `Set ${engine.envVar} to start scanning this engine`;
  }
  if (engine.status === "no-data") {
    return "Configured but has not returned a scan yet";
  }
  return "Scanning normally";
}
