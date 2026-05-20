import { DatabuddyWordmark } from "@notra/ui/components/ui/svgs/databuddyWordmark";
import { Inth } from "@notra/ui/components/ui/svgs/inth";
import { StackAuth } from "@notra/ui/components/ui/svgs/stack-auth";
import { Stagewise } from "@notra/ui/components/ui/svgs/stagewise";
import type { ComponentType, SVGProps } from "react";

export const NOTRA_LOGO_PATH = "/notra-mark.svg";

export const RSS_FEED_PATH = "/rss.xml";
export const RSS_FEED_TITLE = "Notra Blog RSS Feed";
export const RSS_FEED_DESCRIPTION =
  "Insights, guides, and stories from the Notra team.";
export const RSS_FEED_LANGUAGE = "en-us";

export const OG_EXCLUDED_CONTRIBUTOR = "mezotv";
export const OG_MAX_CONTRIBUTORS = 6;
export const OG_MAX_LOGIN_LENGTH = 12;

export const BLOG_HEADING_REGEX = /<h([2-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
export const BLOG_PARAGRAPH_REGEX = /<p[^>]*>([\s\S]*?)<\/p>/gi;
export const BLOG_TAG_REGEX = /<[^>]+>/g;
export const BLOG_WHITESPACE_REGEX = /\s+/g;
export const BLOG_FAQ_HEADING_REGEX =
  /^(frequently asked questions|faqs?|q\s*&\s*a)$/i;
export const BLOG_NUMBERED_HEADING_PREFIX_REGEX = /^\d+\.\s*/;
export const JSON_LD_SCRIPT_CLOSE_REGEX = /<\/(script)/gi;
export const HTML_ENTITY_REGEX = /&(amp|lt|gt|quot|#39|nbsp);/g;

export const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

export const PRICING_PLANS = {
  basic: {
    name: "Basic",
    description: "For solo devs and small teams getting started.",
    pricing: { monthly: 20, annually: 200 },
    cta: {
      label: "Start 7 day free trial",
      href: "https://app.usenotra.com/signup",
    },
    features: [
      "2 team members",
      "$12 in AI Credits per month",
      "3 workflows",
      "2 integrations",
      { label: "30 references", subtitle: "then $0.05 per reference / mo" },
      "14 Days Log Retention",
    ],
  },
  pro: {
    name: "Pro",
    description: "For growing teams that need more power.",
    pricing: { monthly: 50, annually: 500 },
    cta: {
      label: "Get started",
      href: "https://app.usenotra.com/signup",
    },
    features: [
      "5 team members",
      "$32 in AI Credits per month",
      "Unlimited workflows",
      "Unlimited integrations",
      { label: "100 references", subtitle: "then $0.05 per reference / mo" },
      "30 Days Log Retention",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description: "For large teams with custom needs.",
    pricing: { monthly: null, annually: null },
    cta: { label: "Contact us", href: "mailto:hello@usenotra.com" },
    features: [
      "Unlimited team members",
      "Unlimited AI Credits",
      "Unlimited workflows",
      "Custom integrations",
      "Unlimited references",
      "Unlimited Log Retention",
      "Dedicated Support",
    ],
  },
} as const;

const FEATURES_TABLE = [
  {
    category: "Workflows",
    items: [
      {
        name: "Workflows",
        basic: "3",
        pro: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "AI Credits",
        basic: "$12 / month",
        pro: "$32 / month",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    category: "Team",
    items: [
      {
        name: "Team members",
        basic: "2",
        pro: "5",
        enterprise: "Unlimited",
      },
      {
        name: "Integrations",
        basic: "2",
        pro: "Unlimited",
        enterprise: "Custom",
      },
      {
        name: "References",
        basic: "30",
        pro: "100",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    category: "Data",
    items: [
      {
        name: "Log retention",
        basic: "14 Days",
        pro: "30 Days",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        name: "Community support",
        basic: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Email support",
        basic: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "Dedicated support",
        basic: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
] as const;

export const COMPARISON_FEATURES = FEATURES_TABLE.map(
  ({ category, items }) => ({
    category,
    features: items,
  })
);

export const SOCIAL_PROOF_LOGOS: {
  name: string;
  Component: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  className?: string;
}[] = [
  {
    name: "inth",
    Component: Inth,
    href: "https://inth.com?utm_source=notra",
    className: "h-8",
  },
  {
    name: "Databuddy",
    Component: DatabuddyWordmark,
    href: "https://databuddy.cc?utm_source=notra",
    className: "h-8",
  },
  {
    name: "stagewise",
    Component: Stagewise,
    href: "https://stagewise.io?utm_source=notra",
    className: "h-8",
  },
  {
    name: "Stack Auth",
    Component: StackAuth,
    href: "https://stack-auth.com?utm_source=notra",
    className: "h-8",
  },
];
