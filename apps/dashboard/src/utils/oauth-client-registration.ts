import {
  OAUTH_CLIENT_REGISTRATION_DEFAULT_SCOPES,
  OAUTH_DYNAMIC_CLIENT_METADATA_FIELDS,
  OAUTH_SUPPORTED_SCOPE_SET,
} from "@/constants/oauth";

const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "[::1]", "localhost"]);
const REPEATED_SLASHES_PATTERN = /\/{2,}/g;
const TRAILING_SLASHES_PATTERN = /\/+$/;
const WHITESPACE_PATTERN = /\s+/;

export function isOAuthDynamicClientRegistrationPath(pathname: string) {
  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  return (
    decodedPathname
      .replace(REPEATED_SLASHES_PATTERN, "/")
      .replace(TRAILING_SLASHES_PATTERN, "") === "/api/auth/oauth2/register"
  );
}

export function hasOnlyLoopbackRedirectUris(payload: object): boolean {
  if (!("redirect_uris" in payload) || !Array.isArray(payload.redirect_uris)) {
    return false;
  }

  if (payload.redirect_uris.length === 0) {
    return false;
  }

  return payload.redirect_uris.every((redirectUri) => {
    if (typeof redirectUri !== "string") {
      return false;
    }

    try {
      const url = new URL(redirectUri);
      return (
        url.protocol === "http:" &&
        LOOPBACK_HOSTNAMES.has(url.hostname) &&
        url.username === "" &&
        url.password === ""
      );
    } catch {
      return false;
    }
  });
}

export function pickDynamicClientMetadata(payload: object) {
  const metadata: Record<string, unknown> = {};

  for (const field of OAUTH_DYNAMIC_CLIENT_METADATA_FIELDS) {
    if (field in payload) {
      metadata[field] = payload[field as keyof typeof payload];
    }
  }

  return metadata;
}

export function getDynamicClientRegistrationScope(
  payload: object
): string | null {
  if (!("scope" in payload)) {
    return OAUTH_CLIENT_REGISTRATION_DEFAULT_SCOPES.join(" ");
  }

  if (typeof payload.scope !== "string") {
    return null;
  }

  const scopes = [...new Set(payload.scope.trim().split(WHITESPACE_PATTERN))];
  if (
    scopes.length === 0 ||
    scopes.some((scope) => !scope || !OAUTH_SUPPORTED_SCOPE_SET.has(scope))
  ) {
    return null;
  }

  return scopes.join(" ");
}
