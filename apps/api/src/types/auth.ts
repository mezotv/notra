import type { V2KeysVerifyKeyResponseData } from "@unkey/api/models/components";

type AuthData = V2KeysVerifyKeyResponseData;

export function getOrganizationIdFromAuth(auth: AuthData): string | null {
  return auth.identity?.externalId ?? null;
}
