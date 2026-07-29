export function firstNonEmptyLine(value: string): string | null {
  for (const line of value.split(/\r?\n/gu)) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}
