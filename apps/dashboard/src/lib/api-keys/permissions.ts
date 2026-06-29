import {
  API_KEY_GRANULAR_PERMISSIONS,
  API_KEY_GRANULAR_READ_PERMISSIONS,
} from "@/constants/api-keys";
import type { ApiKeyPermission } from "@/types/api-keys";

export function getPermissionsForLevel(permission: ApiKeyPermission) {
  return permission === "api.write"
    ? [...API_KEY_GRANULAR_PERMISSIONS]
    : [...API_KEY_GRANULAR_READ_PERMISSIONS];
}
