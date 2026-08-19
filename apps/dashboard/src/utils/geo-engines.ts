import type { GeoTrackedEngineMode, GeoTrackedEngineStatus } from "@/types/geo";

export function formatEngineMode(mode: GeoTrackedEngineMode): string {
  return mode === "grounded" ? "Web search" : "Training data";
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
