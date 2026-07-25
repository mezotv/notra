import type { SocialConnectPlatform } from "@/schemas/social-accounts";

export interface PublishedSocialPost {
  platform: SocialConnectPlatform;
  postUrl: string | null;
  username: string;
  content: string;
}

export interface PostSocialButtonProps {
  platform: SocialConnectPlatform;
  organizationId: string;
  content: string;
  className?: string;
  onPublished?: (published: PublishedSocialPost) => void;
}

export interface PublishErrorInfo {
  message: string;
  reconnectRequired: boolean;
  docsUrl: string | null;
}
