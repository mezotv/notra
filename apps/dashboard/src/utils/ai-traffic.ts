const PERCENT = 100;
const MIN_BAR_PERCENT = 2;

export function hitBarWidth(hits: number, maxHits: number): number {
  if (maxHits <= 0) {
    return 0;
  }
  return Math.max((hits / maxHits) * PERCENT, MIN_BAR_PERCENT);
}

const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatAiTrafficTimestamp(value: string): string {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return timestampFormatter.format(date);
}
