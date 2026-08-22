function addUniqueValue(values: string[], candidate: string): string[] {
  const trimmed = candidate.trim();
  if (trimmed.length === 0) {
    return values;
  }
  const normalized = trimmed.toLowerCase();
  const exists = values.some((value) => value.toLowerCase() === normalized);
  return exists ? values : [...values, trimmed];
}

export const LINE_BREAK_REGEX = /\r?\n/;

export function addUniqueValues(
  values: string[],
  candidate: string,
  max = Number.POSITIVE_INFINITY
): string[] {
  const parts = candidate.split(LINE_BREAK_REGEX).map((part) => part.trim());
  let next = values;
  for (const part of parts) {
    if (next.length >= max) {
      break;
    }
    next = addUniqueValue(next, part);
  }
  return next;
}

export function removeValue(values: string[], target: string): string[] {
  return values.filter((value) => value !== target);
}
