import type { SocialConnectPlatform } from "@/schemas/social-accounts";

export interface SocialConnectAccountSummary {
  _id: string;
  platform?: string;
  username?: string;
  displayName?: string;
  profilePicture?: string | null;
  metadata?: {
    profileData?: {
      extraData?: {
        verifiedType?: string | null;
      };
    };
  };
}

export interface SocialConnectProfileSummary {
  _id?: string;
  name?: string;
  description?: string;
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

export interface SocialConnectPublishedPost {
  _id?: string;
  platforms?: Array<{
    platform?: string;
    platformPostId?: string | null;
  }>;
}

export interface SocialConnectPublishResult {
  data?: { post?: SocialConnectPublishedPost };
}

export interface SocialConnectPostGetResult {
  data?: { post?: SocialConnectPublishedPost };
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

export interface LinkedInPendingOrganization {
  id?: string;
  urn?: string;
  name?: string;
  vanityName?: string;
  logoUrl?: string;
}

export interface SocialConnectPendingOAuthResult {
  data?: {
    platform?: string;
    profileId?: string;
    tempToken?: string;
    userProfile?: Record<string, unknown>;
    selectionType?: string;
    organizations?: LinkedInPendingOrganization[];
  };
}

export interface SocialConnectLinkedInOrgsResult {
  data?: {
    organizations?: Array<{
      id?: string;
      logoUrl?: string;
      vanityName?: string;
    }>;
  };
}

export interface SocialConnectLinkedInSelectResult {
  data?: {
    account?: {
      accountId?: string;
      username?: string;
      displayName?: string;
      profilePicture?: string;
      accountType?: string;
    };
  };
}

export interface LinkedInSelectionCache {
  tempToken: string;
  userProfile: Record<string, unknown>;
  organizations: LinkedInPendingOrganization[];
}

export interface LinkedInSelectionOptions {
  personal: {
    displayName: string;
    profilePicture: string | null;
  };
  organizations: Array<{
    id: string;
    name: string;
    vanityName: string | null;
    logoUrl: string | null;
  }>;
}
