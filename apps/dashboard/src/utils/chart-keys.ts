const NON_IDENT_PATTERN = /[^a-zA-Z0-9]+/g;
const EDGE_DASH_PATTERN = /^-+|-+$/g;

export function chartKey(value: string): string {
  const sanitized = value
    .replace(NON_IDENT_PATTERN, "-")
    .replace(EDGE_DASH_PATTERN, "");
  return sanitized.length === 0 ? "series" : sanitized;
}
