import {
  AiBrain01Icon,
  BookOpen01Icon,
  CommandLineIcon,
  FavouriteIcon,
  Megaphone01Icon,
  PaintBoardIcon,
  QuillWrite01Icon,
  SparklesIcon,
  TwitterIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type MarketingNavCard = {
  href: string;
  label: string;
  description: string;
  icon: IconSvgElement;
  external?: boolean;
};

export type MarketingNavRailItem = {
  href: string;
  label: string;
  icon: IconSvgElement;
  external?: boolean;
};

export type MarketingNavGroup = {
  type: "group";
  label: string;
  cardsHeading: string;
  cards: readonly MarketingNavCard[];
  railHeading: string;
  rail: readonly MarketingNavRailItem[];
};

type MarketingNavLink = {
  type: "link";
  href: string;
  label: string;
};

export type MarketingNavEntry = MarketingNavGroup | MarketingNavLink;

export const MARKETING_NAV: readonly MarketingNavEntry[] = [
  {
    type: "group",
    label: "Products",
    cardsHeading: "Product",
    cards: [
      {
        href: "/features",
        label: "Features",
        description: "Everything Notra ships for your team",
        icon: SparklesIcon,
      },
      {
        href: "/features/marketing/assets",
        label: "Marketing Assets",
        description: "Launch visuals generated from shipped work",
        icon: PaintBoardIcon,
      },
      {
        href: "/twitter-thread-creator",
        label: "X Thread Builder",
        description: "Free tool to draft threads in your voice",
        icon: TwitterIcon,
      },
    ],
    railHeading: "Developers",
    rail: [
      {
        href: "https://docs.usenotra.com/devtools/mcp",
        label: "MCP Server",
        icon: AiBrain01Icon,
        external: true,
      },
      {
        href: "https://docs.usenotra.com/devtools/cli",
        label: "CLI",
        icon: CommandLineIcon,
        external: true,
      },
    ],
  },
  {
    type: "group",
    label: "Resources",
    cardsHeading: "Resources",
    cards: [
      {
        href: "/blog",
        label: "Blog",
        description: "Writing on shipping, voice, and DX",
        icon: QuillWrite01Icon,
      },
      {
        href: "/changelog/notra",
        label: "Changelog",
        description: "Latest Notra updates",
        icon: Megaphone01Icon,
      },
      {
        href: "/contributors",
        label: "Contributors",
        description: "People building Notra in the open",
        icon: UserGroupIcon,
      },
    ],
    railHeading: "More",
    rail: [
      {
        href: "https://docs.usenotra.com",
        label: "Docs",
        icon: BookOpen01Icon,
        external: true,
      },
      {
        href: "https://www.notrareviews.com/",
        label: "Reviews",
        icon: FavouriteIcon,
        external: true,
      },
    ],
  },
  { type: "link", href: "/pricing", label: "Pricing" },
];

export const FOOTER_TOOL_LINKS = [
  {
    href: "https://www.framer.com/marketplace/plugins/notra/",
    label: "Framer",
    rel: "noopener noreferrer",
    target: "_blank",
  },
  {
    href: "https://www.raycast.com/dominikdev/notra",
    label: "Raycast",
    rel: "noopener noreferrer",
    target: "_blank",
  },
  {
    href: "https://docs.usenotra.com/devtools/mcp",
    label: "MCP Server",
    rel: "noopener noreferrer",
    target: "_blank",
  },
  {
    href: "https://docs.usenotra.com/devtools/cli",
    label: "CLI",
    rel: "noopener noreferrer",
    target: "_blank",
  },
] as const;

export const FOOTER_FREE_TOOL_LINKS = [
  {
    href: "/twitter-thread-creator",
    label: "X Thread Builder",
  },
] as const;

export const FOOTER_INTEGRATION_LINKS = [
  {
    href: "https://github.com",
    label: "GitHub",
    rel: "noopener noreferrer",
    target: "_blank",
  },
  {
    href: "https://linear.app",
    label: "Linear",
    rel: "noopener noreferrer",
    target: "_blank",
  },
] as const;

export const FOOTER_PRODUCT_LINKS = [
  {
    href: "/features",
    label: "Features",
  },
  {
    href: "/features/marketing/assets",
    label: "Marketing Assets",
  },
  {
    href: "/pricing",
    label: "Pricing",
  },
  {
    href: "/blog",
    label: "Blog",
  },
  {
    href: "/changelog/notra",
    label: "Changelog",
  },
  {
    href: "/changelog",
    label: "Examples",
  },
  {
    href: "/contributors",
    label: "Contributors",
  },
  {
    href: "https://www.notrareviews.com/",
    label: "Reviews",
    target: "_blank",
  },
  {
    href: "https://docs.usenotra.com",
    label: "Docs",
    rel: "noopener noreferrer",
    target: "_blank",
  },
] as const;
