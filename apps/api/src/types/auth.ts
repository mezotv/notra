import type { V2KeysVerifyKeyResponseData } from "@unkey/api/models/components";

type ApiKeyAuthData = V2KeysVerifyKeyResponseData;

interface OAuthAuthData {
  type: "oauth";
  keyId: string;
  userId: string;
  scopes: string[];
  identity: {
    externalId: string;
  };
}

export type AuthData = ApiKeyAuthData | OAuthAuthData;

export function getOrganizationIdFromAuth(auth: AuthData): string | null {
  return auth.identity?.externalId ?? null;
}
