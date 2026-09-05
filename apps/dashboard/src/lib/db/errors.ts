export function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if ("code" in error && error.code === "23505") {
    return true;
  }
  return "cause" in error && isUniqueConstraintError(error.cause);
}
