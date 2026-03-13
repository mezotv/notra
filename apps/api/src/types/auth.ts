import type { V2KeysVerifyKeyResponseData } from "@unkey/api/models/components";

export type AuthData = V2KeysVerifyKeyResponseData;

export function getOrganizationIdFromAuth(auth: AuthData): string | null {
  return auth.identity?.externalId ?? null;
}
