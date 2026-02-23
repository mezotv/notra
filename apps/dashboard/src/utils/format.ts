export function formatSnakeCaseLabel(value: string): string {
  return value.replaceAll("_", " ").trim();
}
