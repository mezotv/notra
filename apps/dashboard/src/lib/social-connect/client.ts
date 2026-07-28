import "server-only";
import PostForMe from "post-for-me";
import type { SocialConnectPlatform } from "@/schemas/social-accounts";

let client: PostForMe | null = null;

const PROVIDER_PLATFORMS: Record<SocialConnectPlatform, string> = {
  twitter: "x",
  linkedin: "linkedin",
};

export function isSocialConnectConfigured(): boolean {
  return Boolean(process.env.POST_FOR_ME_API_KEY);
}

export function getSocialConnectClient(): PostForMe {
  if (!isSocialConnectConfigured()) {
    throw new Error("Social account linking is not configured");
  }
  client ??= new PostForMe();
  return client;
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
