import { PUBLIC_API_SCOPE_RESOURCES } from "../constants/oauth-scopes";

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

  if (LEGACY_ORGANIZATION_POSTS_REGEX.test(path)) {
    return scopeForResource("posts", method);
  }

  if (LEGACY_ORGANIZATION_SCHEDULES_REGEX.test(path)) {
    return scopeForResource("schedules", method);
  }

  const resource = PUBLIC_API_SCOPE_RESOURCES.find((item) =>
    item.paths.some(
      (resourcePath) =>
        path === resourcePath || path.startsWith(`${resourcePath}/`)
    )
  );
  if (resource) {
    return MUTATION_METHODS.has(method)
      ? resource.writeScope
      : resource.readScope;
  }

  return undefined;
}
