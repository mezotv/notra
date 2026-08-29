import {
  GEO_SCAN_INTERVAL_FALLBACK_NOUN,
  GEO_SCAN_INTERVAL_LABEL_PREFIX,
  GEO_SCAN_INTERVAL_OPTIONS,
  GEO_SCAN_STALE_MS,
} from "@/constants/geo";
import type { GeoEngineAttemptSummary } from "@/types/geo";

function toTimestamp(value: Date | string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isGeoScanRunning(
  scanStartedAt: Date | string | null | undefined,
  lastScanAt: Date | string | null | undefined,
  now = Date.now(),
  staleMs = GEO_SCAN_STALE_MS
): boolean {
  const startedAt = toTimestamp(scanStartedAt);
  if (startedAt === null || now - startedAt > staleMs) {
    return false;
  }
  const finishedAt = toTimestamp(lastScanAt);
  return finishedAt === null || startedAt > finishedAt;
}

export function geoScanEmptyMessage(
  isScanning: boolean,
  idleMessage: string
): string {
  return isScanning ? "Scanning engines…" : idleMessage;
}

export function geoScanIntervalNoun(intervalHours: number): string {
  const option = GEO_SCAN_INTERVAL_OPTIONS.find(
    (entry) => entry.value === intervalHours
  );
  if (!option) {
    return GEO_SCAN_INTERVAL_FALLBACK_NOUN;
  }
  return option.label.replace(GEO_SCAN_INTERVAL_LABEL_PREFIX, "").toLowerCase();
}

export function summarizeGeoEngineAttempts(
  tasks: readonly { engine: string }[],
  results: readonly unknown[]
): GeoEngineAttemptSummary[] {
  const byEngine = new Map<string, GeoEngineAttemptSummary>();
  for (const [index, task] of tasks.entries()) {
    const summary = byEngine.get(task.engine) ?? {
      engine: task.engine,
      attempted: 0,
      failed: 0,
    };
    summary.attempted += 1;
    if (results[index] === null) {
      summary.failed += 1;
    }
    byEngine.set(task.engine, summary);
  }
  return [...byEngine.values()];
}
