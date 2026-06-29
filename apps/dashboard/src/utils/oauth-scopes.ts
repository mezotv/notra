import { OAUTH_DEFAULT_SCOPES, OAUTH_LEGACY_SCOPES } from "@/constants/oauth";

const LEGACY_SCOPE_SET: ReadonlySet<string> = new Set(OAUTH_LEGACY_SCOPES);

export function expandLegacyOAuthScopes(scopes: readonly string[]) {
  if (!scopes.some((scope) => LEGACY_SCOPE_SET.has(scope))) {
    return [...scopes];
  }

  const next = new Set(scopes);
  for (const scope of OAUTH_LEGACY_SCOPES) {
    next.delete(scope);
  }
  for (const scope of OAUTH_DEFAULT_SCOPES) {
    next.add(scope);
  }

  return [...next];
}
