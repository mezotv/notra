import { parseClickHouseDateTime } from "@notra/analytics/utils/datetime";
import type { GeoTrafficLogEntry, GeoVisitorType } from "@/types/geo";
import { formatGeoSource } from "@/utils/ai-traffic";

export function formatCitationTimestamp(value: string): string {
  const date = parseClickHouseDateTime(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${month}/${day}/${date.getUTCFullYear()} ${hours}:${minutes}:${seconds}`;
}

export function formatCitationProvider(
  agent: string,
  source: string,
  visitorType: GeoVisitorType
): string {
  const trimmed = agent.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  return formatGeoSource(source, visitorType);
}

export function citationRowId(
  entry: GeoTrafficLogEntry,
  index: number
): string {
  return `${entry.capturedAt}-${entry.source}-${entry.path}-${index}`;
}
