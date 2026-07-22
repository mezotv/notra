const NON_ALPHANUMERIC_RUN_REGEX = /[^a-z0-9]+/;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .split(NON_ALPHANUMERIC_RUN_REGEX)
    .filter(Boolean)
    .join("-");
}
