export function formatReasoningDurationLabel(
  durationSeconds: number | null
): string {
  if (!durationSeconds || durationSeconds <= 1) {
    return "Thought for a moment";
  }

  return `Thought for ${durationSeconds} seconds`;
}
