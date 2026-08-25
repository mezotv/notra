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

export interface IngestAuthData {
  type: "ingest";
  keyId: string;
  scopes: string[];
  projectId: string | null;
  identity: {
    externalId: string;
  };
}

export type AuthData = ApiKeyAuthData | OAuthAuthData | IngestAuthData;

export function getOrganizationIdFromAuth(auth: AuthData): string | null {
  return auth.identity?.externalId ?? null;
}

export function isIngestAuth(auth: AuthData): auth is IngestAuthData {
  return "type" in auth && auth.type === "ingest";
}
