import {
  AiBrain01Icon,
  BookOpen01Icon,
  CommandLineIcon,
  FavouriteIcon,
  Megaphone01Icon,
  PaintBoardIcon,
  QuillWrite01Icon,
  SparklesIcon,
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
        description: "See what Notra can do for you",
        icon: SparklesIcon,
      },
      {
        href: "/features/marketing/assets",
        label: "Marketing Assets",
        description: "Generate assets from shipped work",
        icon: PaintBoardIcon,
      },
    ],
    railHeading: "Developers",
    rail: [
      {
        href: "/mcp",
        label: "MCP Server",
        icon: AiBrain01Icon,
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
        description: "Writing on shipping, voice and DX",
        icon: QuillWrite01Icon,
      },
      {
        href: "/changelog/notra",
        label: "Changelog",
        description: "Overview of latest Notra changes",
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
