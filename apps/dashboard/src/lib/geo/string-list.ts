export function addUniqueValue(values: string[], candidate: string): string[] {
  const trimmed = candidate.trim();
  if (trimmed.length === 0) {
    return values;
  }
  const normalized = trimmed.toLowerCase();
  const exists = values.some((value) => value.toLowerCase() === normalized);
  return exists ? values : [...values, trimmed];
}

export function removeValue(values: string[], target: string): string[] {
  return values.filter((value) => value !== target);
}
