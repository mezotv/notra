export function errorMessageOr(
  message: string | null | undefined,
  fallback: string
): string {
  return message || fallback;
}
