import type { OnDemandContentType } from "@/schemas/content";

interface FormatCardMeta {
  label: string;
  description: string;
  iconClass: string;
}

export const FORMAT_CARD_META: Record<OnDemandContentType, FormatCardMeta> = {
  changelog: {
    label: "Changelog entry",
    description: "A concise summary of what shipped and why it matters.",
    iconClass: "text-violet-500 dark:text-violet-300",
  },
  blog_post: {
    label: "Blog post",
    description: "A longer-form article explaining the feature in depth.",
    iconClass: "text-emerald-500 dark:text-emerald-300",
  },
  linkedin_post: {
    label: "LinkedIn post",
    description: "A professional update to share with your network.",
    iconClass: "text-[#0A66C2]",
  },
  twitter_post: {
    label: "Tweet",
    description: "A short, punchy announcement for X / Twitter.",
    iconClass: "text-foreground",
  },
};

export const FORMAT_ORDER: OnDemandContentType[] = [
  "changelog",
  "blog_post",
  "linkedin_post",
  "twitter_post",
];
