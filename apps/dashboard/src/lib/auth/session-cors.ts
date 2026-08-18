const ALLOWED_ORIGINS = new Set([
  "https://usenotra.com",
  "https://www.usenotra.com",
]);
const LOCALHOST_ORIGIN_PATTERN = /^http:\/\/localhost:\d+$/;

function isAllowedOrigin(origin: string) {
  return ALLOWED_ORIGINS.has(origin) || LOCALHOST_ORIGIN_PATTERN.test(origin);
}

export function buildSessionCorsHeaders(
  origin: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    Vary: "Origin",
  };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}
