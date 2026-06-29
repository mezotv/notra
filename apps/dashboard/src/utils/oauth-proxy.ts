import { OAUTH_CLIENT_REGISTRATION_DEFAULT_SCOPES } from "@/constants/oauth";
import { auth } from "@/lib/auth/server";

const AUTH_ROUTE_PREFIX = "/api/auth";
const INTERNAL_AUTH_ORIGIN = "http://notra.internal";
const TOKEN_PATH = "/oauth2/token";
const REGISTER_PATH = "/oauth2/register";
const ALLOWED_OAUTH_PROXY_PATHS = new Set([
  TOKEN_PATH,
  REGISTER_PATH,
  "/oauth2/revoke",
]);
const FORWARDED_HEADER_NAMES = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
] as const;

export function buildOAuthForwardedHeaders(
  source: Headers,
  overrides?: HeadersInit
) {
  const headers = new Headers();

  for (const name of FORWARDED_HEADER_NAMES) {
    const value = source.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  if (overrides) {
    for (const [name, value] of new Headers(overrides)) {
      headers.set(name, value);
    }
  }

  return headers;
}

function withDefaultRegistrationScopes(body: ArrayBuffer) {
  try {
    const payload = JSON.parse(new TextDecoder().decode(body));

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return body;
    }

    if ("scope" in payload && typeof payload.scope === "string") {
      return body;
    }

    return new TextEncoder().encode(
      JSON.stringify({
        ...payload,
        scope: OAUTH_CLIENT_REGISTRATION_DEFAULT_SCOPES.join(" "),
      })
    ).buffer;
  } catch {
    return body;
  }
}

export async function proxyOAuthRequest(request: Request, pathname: string) {
  if (!ALLOWED_OAUTH_PROXY_PATHS.has(pathname)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const targetUrl = new URL(
    `${AUTH_ROUTE_PREFIX}${pathname}`,
    INTERNAL_AUTH_ORIGIN
  );
  targetUrl.search = new URL(request.url).search;

  const rawBody =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
  const body =
    rawBody && pathname === REGISTER_PATH
      ? withDefaultRegistrationScopes(rawBody)
      : rawBody;

  const response = await auth.handler(
    new Request(targetUrl, {
      body,
      headers: buildOAuthForwardedHeaders(request.headers),
      method: request.method,
      redirect: "manual",
    })
  );

  const headers = new Headers(response.headers);

  if (pathname === TOKEN_PATH) {
    headers.set("Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
  }

  return new Response(response.body, {
    headers,
    status: response.status,
  });
}
