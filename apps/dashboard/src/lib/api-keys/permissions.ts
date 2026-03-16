import type { ApiKeyPermission } from "@/schemas/api-keys";

export function getPermissionsForLevel(permission: ApiKeyPermission) {
  return permission === "api.write" ? ["api.read", "api.write"] : ["api.read"];
}

export function getPermissionLevel(
  permissions: string[],
  fallbackPermission: unknown = "api.read"
): ApiKeyPermission {
  if (permissions.includes("api.write")) {
    return "api.write";
  }

  if (permissions.includes("api.read")) {
    return "api.read";
  }

  return fallbackPermission === "api.write" ? "api.write" : "api.read";
}
