import {
  AiBrain01Icon,
  BookOpen01Icon,
  SparklesIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

export const CONTACT_RECIPIENT = "hello@usenotra.com";

export const CONTACT_RATE_LIMIT = {
  requests: 3,
  window: "1h",
} as const;

export const CONTACT_MESSAGE_MIN_LENGTH = 10;
export const CONTACT_MESSAGE_MAX_LENGTH = 2000;

export const CONTACT_RESPONSE_TIME =
  "Within one business day, often the same hour.";

export const CONTACT_PURPOSE =
  "For sales, support, security disclosures, and general questions.";

export const CONTACT_RESOURCE_LINKS = [
  {
    href: "https://docs.usenotra.com",
    label: "Documentation",
    description: "Guides, API reference, and setup walkthroughs.",
    icon: BookOpen01Icon,
    external: true,
  },
  {
    href: "https://docs.usenotra.com/devtools/mcp",
    label: "MCP server",
    description: "Connect Notra to your agents and editors.",
    icon: AiBrain01Icon,
    external: true,
  },
  {
    href: "/oss-program",
    label: "OSS program",
    description: "Free Notra Pro for open source maintainers.",
    icon: UserGroupIcon,
    external: false,
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "Plans and limits for every team size.",
    icon: SparklesIcon,
    external: false,
  },
] as const;
