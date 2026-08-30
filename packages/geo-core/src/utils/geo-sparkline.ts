import type { GeoSparklinePoint } from "../types/geo";

export function groupGeoSparklinePoints<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
  pointOf: (row: T) => GeoSparklinePoint
): Map<string, GeoSparklinePoint[]> {
  const grouped = new Map<string, GeoSparklinePoint[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const points = grouped.get(key) ?? [];
    points.push(pointOf(row));
    grouped.set(key, points);
  }
  return grouped;
}

export function sumGeoSparklinePoints(
  series: readonly (readonly GeoSparklinePoint[])[]
): GeoSparklinePoint[] {
  const totals = new Map<string, number>();
  for (const points of series) {
    for (const point of points) {
      totals.set(point.day, (totals.get(point.day) ?? 0) + point.value);
    }
  }
  return [...totals]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, value]) => ({ day, value }));
}
