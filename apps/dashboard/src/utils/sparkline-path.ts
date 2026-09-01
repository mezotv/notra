import type { SparklinePathInput } from "@/types/charts";

function coord(value: number): string {
  return value.toFixed(2);
}

export function sparklinePolyline({
  values,
  width,
  height,
  padding = 0,
}: SparklinePathInput): string {
  if (values.length === 0 || width <= 0 || height <= 0) {
    return "";
  }

  const innerWidth = Math.max(width - padding * 2, 0);
  const innerHeight = Math.max(height - padding * 2, 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const lastIndex = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = padding + (index / lastIndex) * innerWidth;
      const y =
        span === 0
          ? padding + innerHeight / 2
          : padding + innerHeight - ((value - min) / span) * innerHeight;
      return `${coord(x)},${coord(y)}`;
    })
    .join(" ");
}
