import {
  GithubIcon,
  Globe02Icon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import type { ApplicableTo, ReferenceType } from "@/schemas/brand";
import type { PersonaSocialPlatformConfig } from "@/types/components/personas";

export const PERSONA_REFERENCE_TYPE_LABELS: Record<string, string> = {
  twitter_post: "X post",
  linkedin_post: "LinkedIn post",
  blog_post: "Blog post",
  custom: "Custom",
};

export const PERSONA_REFERENCE_TYPE_OPTIONS: {
  value: ReferenceType;
  label: string;
}[] = [
  { value: "twitter_post", label: "X post" },
  { value: "linkedin_post", label: "LinkedIn post" },
  { value: "blog_post", label: "Blog post" },
  { value: "custom", label: "Custom writing sample" },
];

export const PERSONA_REFERENCE_DEFAULT_APPLICABLE_TO: Record<
  ReferenceType,
  ApplicableTo
> = {
  twitter_post: ["twitter"],
  linkedin_post: ["linkedin"],
  blog_post: ["blog"],
  custom: ["all"],
};

export const PERSONA_SOCIAL_PLATFORMS: PersonaSocialPlatformConfig[] = [
  {
    value: "twitter",
    label: "X (Twitter)",
    icon: NewTwitterIcon,
    placeholder: "username",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: Linkedin01Icon,
    placeholder: "username",
  },
  {
    value: "github",
    label: "GitHub",
    icon: GithubIcon,
    placeholder: "username",
  },
  {
    value: "instagram",
    label: "Instagram",
    icon: InstagramIcon,
    placeholder: "username",
  },
  {
    value: "youtube",
    label: "YouTube",
    icon: YoutubeIcon,
    placeholder: "handle",
  },
  {
    value: "tiktok",
    label: "TikTok",
    icon: TiktokIcon,
    placeholder: "username",
  },
  {
    value: "website",
    label: "Website",
    icon: Globe02Icon,
    placeholder: "example.com",
  },
];
