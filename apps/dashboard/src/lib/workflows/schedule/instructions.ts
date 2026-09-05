/**
 * Wraps the per-schedule brief so the writer can tell it apart from the
 * organization-wide brand instructions it is concatenated with.
 */
export function buildScheduleInstructions(
  instructions: string | null | undefined
): string | null {
  const trimmed = instructions?.trim();
  if (!trimmed) {
    return null;
  }
  return `<schedule-focus>\nThe person who set up this schedule asked for the following. Treat it as the brief for this specific run and follow it over any generic defaults, while keeping the brand voice above.\n${trimmed}\n</schedule-focus>`;
}
