import type { SocialConnectPlatform } from "@/schemas/social-accounts";

export const SOCIAL_PLATFORM_LABELS: Record<SocialConnectPlatform, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
};

export const SOCIAL_CONNECTED_PARAMS: Record<SocialConnectPlatform, string> = {
  twitter: "twitterConnected",
  linkedin: "linkedinConnected",
};

export const SOCIAL_CONNECT_STATE_TTL_SECONDS = 600;
