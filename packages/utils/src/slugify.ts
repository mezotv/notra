const NON_ALPHANUMERIC_RUN_REGEX = /[^a-z0-9]+/g;
const EDGE_HYPHENS_REGEX = /^-+|-+$/g;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(NON_ALPHANUMERIC_RUN_REGEX, "-")
    .replace(EDGE_HYPHENS_REGEX, "");
}
