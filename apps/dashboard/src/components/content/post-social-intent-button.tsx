"use client";

import { Linkedin } from "@notra/ui/components/ui/svgs/linkedin";
import { XTwitter } from "@notra/ui/components/ui/svgs/twitter";
import { Button } from "@/components/button";
import { LINKEDIN_BRAND_PRIMARY } from "@/constants/linkedin";
import { SOCIAL_PLATFORM_LABELS } from "@/constants/social-connect";
import { TWITTER_BRAND_COLOR } from "@/constants/twitter";
import { cn } from "@/lib/utils";
import type { PostSocialIntentButtonProps } from "@/types/content/post-social";
import {
  copyLinkedInPostForPublishing,
  createLinkedInPostUrl,
} from "@/utils/linkedin";
import { createTwitterPostUrl } from "@/utils/twitter";

export function PostSocialIntentButton({
  platform,
  content,
  className,
}: PostSocialIntentButtonProps) {
  const label = SOCIAL_PLATFORM_LABELS[platform];
  const brandColor =
    platform === "twitter" ? TWITTER_BRAND_COLOR : LINKEDIN_BRAND_PRIMARY;
  const BrandIcon = platform === "twitter" ? XTwitter : Linkedin;

  return (
    <Button
      className={cn("text-white hover:opacity-90", className)}
      nativeButton={false}
      render={
        platform === "twitter" ? (
          <a
            href={createTwitterPostUrl(content)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <BrandIcon className="size-4" />
            Post to {label}
          </a>
        ) : (
          <a
            href={createLinkedInPostUrl(content)}
            onClick={() => copyLinkedInPostForPublishing(content)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <BrandIcon className="size-4" />
            Post to {label}
          </a>
        )
      }
      size="sm"
      style={{ backgroundColor: brandColor }}
    />
  );
}
