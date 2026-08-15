const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/([a-z0-9-]+\.)?usenotra\.com$/,
  /^http:\/\/localhost:\d+$/,
];

export function buildSessionCorsHeaders(
  origin: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    Vary: "Origin",
  };

  if (origin && ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin))) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}
