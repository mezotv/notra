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

function citationPageOffset(page: number, pageSize: number): number {
  return Math.max(0, page - 1) * pageSize;
}

export function citationPageCount(total: number, pageSize: number): number {
  if (pageSize <= 0 || total <= 0) {
    return 1;
  }
  return Math.ceil(total / pageSize);
}

export function formatCitationRange(
  page: number,
  pageSize: number,
  total: number
): string {
  if (total === 0) {
    return "Showing 0 of 0 requests";
  }
  const start = citationPageOffset(page, pageSize) + 1;
  const end = Math.min(page * pageSize, total);
  return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} requests`;
}

export function citationPageRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number
): T[] {
  const start = citationPageOffset(page, pageSize);
  return rows.slice(start, start + pageSize);
}

export function geoCitationsHref(
  organizationSlug: string,
  projectId?: string
): string {
  const path = `/${organizationSlug}/geo/citations`;
  if (!projectId) {
    return path;
  }
  return `${path}?project=${encodeURIComponent(projectId)}`;
}

export function citationRowId(
  entry: GeoTrafficLogEntry,
  index: number
): string {
  return `${entry.capturedAt}-${entry.source}-${entry.path}-${index}`;
}
