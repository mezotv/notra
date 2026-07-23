import type { SocialConnectPlatform } from "@/schemas/social-accounts";

export interface SocialConnectAccountSummary {
  _id: string;
  username?: string;
  displayName?: string;
  profilePicture?: string | null;
}

export interface SocialConnectProfileSummary {
  _id?: string;
  name?: string;
}

export interface SocialConnectProfilesListResult {
  data?: { profiles?: SocialConnectProfileSummary[] };
}

export interface SocialConnectProfileCreateResult {
  data?: { profile?: SocialConnectProfileSummary };
}

export interface SocialConnectUrlResult {
  data?: { authUrl?: string };
}

export interface SocialConnectAccountsListResult {
  data?: { accounts: SocialConnectAccountSummary[] };
}

export interface BeginSocialConnectParams {
  organizationId: string;
  platform: SocialConnectPlatform;
  callbackPath: string;
  baseUrl: string;
}

export interface CompleteSocialConnectParams {
  state: string;
  accountId?: string;
  username?: string;
  error?: string;
}

export interface CompleteSocialConnectResult {
  callbackPath: string;
  platform: SocialConnectPlatform;
}
