import type { SocialConnectPlatform } from "@/schemas/social-accounts";

export interface BeginSocialConnectParams {
  organizationId: string;
  platform: SocialConnectPlatform;
  callbackPath: string;
}

export interface CompleteSocialConnectParams {
  accountIds: string[];
}

export interface CompleteSocialConnectResult {
  callbackPath: string;
  platform: SocialConnectPlatform;
}

export interface RefreshedAccountStatus {
  username: string;
  status: "updated" | "missing";
}

export interface PublishSocialPostParams {
  organizationId: string;
  accountId: string;
  content: string;
}
