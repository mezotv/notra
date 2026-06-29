const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const VERSION_PREFIX_REGEX = /^\/v1(?=\/|$)/;
const LEGACY_ORGANIZATION_POSTS_REGEX = /^\/[^/]+\/posts(?:\/|$)/;
const LEGACY_ORGANIZATION_SCHEDULES_REGEX = /^\/[^/]+\/schedules(?:\/|$)/;

function scopeForResource(resource: string, method: string) {
  return `${resource}.${MUTATION_METHODS.has(method) ? "write" : "read"}`;
}

export function getRequiredOAuthScope(pathname: string, method: string) {
  const path = pathname.replace(VERSION_PREFIX_REGEX, "") || "/";

  if (path === "/status") {
    return undefined;
  }

  if (path.startsWith("/posts/") || path === "/posts") {
    return scopeForResource("posts", method);
  }

  if (LEGACY_ORGANIZATION_POSTS_REGEX.test(path)) {
    return scopeForResource("posts", method);
  }

  if (path.startsWith("/brand-identities/") || path === "/brand-identities") {
    return scopeForResource("brand-identities", method);
  }

  if (path.startsWith("/integrations/") || path === "/integrations") {
    return scopeForResource("integrations", method);
  }

  if (path.startsWith("/schedules/") || path === "/schedules") {
    return scopeForResource("schedules", method);
  }

  if (LEGACY_ORGANIZATION_SCHEDULES_REGEX.test(path)) {
    return scopeForResource("schedules", method);
  }

  if (path.startsWith("/chats/") || path === "/chats") {
    return scopeForResource("chats", method);
  }

  if (path.startsWith("/skills/") || path === "/skills") {
    return scopeForResource("skills", method);
  }

  return undefined;
}
