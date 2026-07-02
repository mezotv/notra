const SECONDS_PER_MINUTE = 60;

export function formatElapsedSeconds(totalSeconds: number): string {
  if (totalSeconds < SECONDS_PER_MINUTE) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}m ${seconds}s`;
}
