import type { GeoConversionPageVisit, GeoConversionTotals } from "../types/geo";

const ROOT_PATH = "/";
const TRAILING_SLASHES_REGEX = /\/+$/;

export function normalizeConversionPath(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const withLeadingSlash = trimmed.startsWith(ROOT_PATH)
    ? trimmed
    : `${ROOT_PATH}${trimmed}`;
  if (withLeadingSlash === ROOT_PATH) {
    return ROOT_PATH;
  }
  const stripped = withLeadingSlash.replace(TRAILING_SLASHES_REGEX, "");
  return stripped.length === 0 ? ROOT_PATH : stripped;
}

export function normalizeConversionPaths(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeConversionPath(value);
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function matchesConversionPath(
  path: string,
  conversionPaths: readonly string[]
): boolean {
  const candidate = normalizeConversionPath(path);
  if (candidate.length === 0) {
    return false;
  }
  return conversionPaths.some((conversionPath) => {
    if (candidate === conversionPath) {
      return true;
    }
    if (conversionPath === ROOT_PATH) {
      return false;
    }
    return (
      candidate.startsWith(`${conversionPath}/`) ||
      candidate.startsWith(`${conversionPath}?`)
    );
  });
}

export function sumConversionVisits(
  pages: readonly GeoConversionPageVisit[],
  conversionPaths: readonly string[]
): GeoConversionTotals {
  let conversions = 0;
  let previousConversions: number | null = null;
  for (const page of pages) {
    if (!matchesConversionPath(page.path, conversionPaths)) {
      continue;
    }
    conversions += page.visits;
    if (page.previousVisits !== undefined) {
      previousConversions = (previousConversions ?? 0) + page.previousVisits;
    }
  }
  return { conversions, previousConversions };
}
