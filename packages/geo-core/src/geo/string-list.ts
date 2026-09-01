export const LINE_BREAK_REGEX = /\r?\n/;

export function addUniqueValues(
  values: string[],
  candidate: string,
  max = Number.POSITIVE_INFINITY
): string[] {
  if (values.length >= max) {
    return values;
  }

  const normalizedValues = new Set(values.map((value) => value.toLowerCase()));
  let next: string[] | undefined;
  for (const part of candidate.split(LINE_BREAK_REGEX)) {
    if ((next?.length ?? values.length) >= max) {
      break;
    }
    const trimmed = part.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const normalized = trimmed.toLowerCase();
    if (normalizedValues.has(normalized)) {
      continue;
    }
    normalizedValues.add(normalized);
    next ??= [...values];
    next.push(trimmed);
  }
  return next ?? values;
}

export function removeValue(values: string[], target: string): string[] {
  return values.filter((value) => value !== target);
}
