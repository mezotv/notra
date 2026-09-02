export function sanitizeReturnTo(value: string | null): string | null {
  if (!value) {
    return null;
  }

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  if (
    decoded.startsWith("/") &&
    !decoded.startsWith("//") &&
    !decoded.includes("\\")
  ) {
    return decoded;
  }

  return null;
}

export function buildPostAuthRedirectPath(
  returnTo: string | null | undefined
): string {
  const safeReturnTo = sanitizeReturnTo(returnTo ?? null);

  if (!safeReturnTo) {
    return "/callback";
  }

  const callbackPath = safeReturnTo.split(/[?#]/, 1)[0];
  if (callbackPath === "/callback") {
    return safeReturnTo;
  }

  return `/callback?returnTo=${encodeURIComponent(safeReturnTo)}`;
}
