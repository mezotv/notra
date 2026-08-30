import { GEO_IMPORT_COPY } from "@notra/geo-core/constants/geo-import";
import type {
  GeoImportKind,
  GeoImportResult,
} from "@notra/geo-core/types/geo-import";

export function geoImportNoun(kind: GeoImportKind, count: number): string {
  const copy = GEO_IMPORT_COPY[kind];
  return count === 1 ? copy.noun : copy.nounPlural;
}

export function describeGeoImportResult(
  kind: GeoImportKind,
  result: GeoImportResult
): string {
  const parts: string[] = [];
  if (result.imported > 0) {
    parts.push(
      `Imported ${result.imported} ${geoImportNoun(kind, result.imported)}`
    );
  }
  if (result.updated > 0) {
    parts.push(`updated ${result.updated}`);
  }
  if (result.skipped > 0) {
    parts.push(
      `skipped ${result.skipped} duplicate${result.skipped === 1 ? "" : "s"}`
    );
  }
  if (parts.length === 0) {
    return `No new ${GEO_IMPORT_COPY[kind].nounPlural} to import`;
  }
  return parts.join(", ");
}

export function formatCsvFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(kilobytes < 10 ? 1 : 0)} KB`;
  }
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}
