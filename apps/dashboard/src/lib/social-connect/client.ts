import "server-only";
import PostForMe from "post-for-me";
import type { SocialConnectPlatform } from "@/schemas/social-accounts";

const clients = new Map<string, PostForMe>();

const PROVIDER_PLATFORMS: Record<SocialConnectPlatform, string> = {
  twitter: "x",
  linkedin: "linkedin",
};

function getApiKey(platform: SocialConnectPlatform): string | undefined {
  const specificKey =
    platform === "twitter"
      ? process.env.POST_FOR_ME_API_KEY_TWITTER
      : process.env.POST_FOR_ME_API_KEY_LINKEDIN;
  return specificKey || process.env.POST_FOR_ME_API_KEY || undefined;
}

export function isSocialConnectConfigured(): boolean {
  return Boolean(getApiKey("twitter") || getApiKey("linkedin"));
}

export function getSocialConnectClient(
  platform: SocialConnectPlatform
): PostForMe {
  const apiKey = getApiKey(platform);
  if (!apiKey) {
    throw new Error("Social account linking is not configured");
  }
  const existing = clients.get(apiKey);
  if (existing) {
    return existing;
  }
  const created = new PostForMe({ apiKey });
  clients.set(apiKey, created);
  return created;
}

export function toProviderPlatform(platform: SocialConnectPlatform): string {
  return PROVIDER_PLATFORMS[platform];
}

export function fromProviderPlatform(
  providerPlatform: string
): SocialConnectPlatform | null {
  if (providerPlatform === "x" || providerPlatform === "twitter") {
    return "twitter";
  }
  if (providerPlatform === "linkedin") {
    return "linkedin";
  }
  return null;
}

export function hasProviderPremium(metadata: unknown): boolean {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "has_platform_premium" in metadata &&
    metadata.has_platform_premium === true
  );
}
