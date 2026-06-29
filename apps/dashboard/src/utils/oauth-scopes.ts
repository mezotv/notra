import {
  OAUTH_DEFAULT_SCOPES,
  OAUTH_LEGACY_SCOPES,
  OAUTH_SUPPORTED_SCOPES,
} from "@/constants/oauth";

const LEGACY_SCOPE_SET: ReadonlySet<string> = new Set(OAUTH_LEGACY_SCOPES);
const OFFLINE_ACCESS_SCOPE = "offline_access";

export function expandLegacyOAuthScopes(scopes: readonly string[]) {
  if (!scopes.some((scope) => LEGACY_SCOPE_SET.has(scope))) {
    return [...scopes];
  }

  const next = new Set(scopes);
  for (const scope of OAUTH_LEGACY_SCOPES) {
    next.delete(scope);
  }
  const expandedScopes: readonly string[] = scopes.includes("api.write")
    ? OAUTH_SUPPORTED_SCOPES.filter((scope) => scope !== OFFLINE_ACCESS_SCOPE)
    : OAUTH_DEFAULT_SCOPES;
  for (const scope of expandedScopes) {
    next.add(scope);
  }

  return [...next];
}
