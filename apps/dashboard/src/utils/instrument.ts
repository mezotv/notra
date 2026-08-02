const CLOCK_PAD = 2;

export function formatSyncClock(timestamp: number | null): string {
  if (!timestamp) {
    return "--:--";
  }
  const date = new Date(timestamp);
  return [date.getHours(), date.getMinutes()]
    .map((part) => String(part).padStart(CLOCK_PAD, "0"))
    .join(":");
}
