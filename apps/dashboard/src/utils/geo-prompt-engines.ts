export function adjacentPromptEngine(
  engines: readonly string[],
  current: string,
  delta: number
): string {
  if (engines.length === 0) {
    return current;
  }

  const index = engines.indexOf(current);
  const from = index === -1 ? 0 : index;
  const next = (from + delta) % engines.length;
  const wrapped = next < 0 ? next + engines.length : next;
  return engines[wrapped] ?? current;
}
