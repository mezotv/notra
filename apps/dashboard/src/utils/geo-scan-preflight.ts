import { GEO_SCAN_PREFLIGHT_NEVER_SCANNED } from "@notra/geo-core/constants/geo";

import { formatRelative } from "@/utils/format-relative";
import { formatEngineFamily } from "@/utils/geo-charts";

export function scanPreflightEngineNames(engines: readonly string[]): string[] {
  return [...new Set(engines.map((engine) => formatEngineFamily(engine)))];
}

export function formatScanPreflightLastScan(lastScanAt: string | null): string {
  if (!lastScanAt) {
    return GEO_SCAN_PREFLIGHT_NEVER_SCANNED;
  }
  return formatRelative(lastScanAt);
}
