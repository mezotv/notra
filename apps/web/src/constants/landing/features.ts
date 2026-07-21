import type {
  FeaturesCardCopy,
  FeaturesConnectCard,
  FeaturesPermission,
  FeaturesToolCard,
} from "@/types/landing/features";

export const FEATURES_HEADING = "Everything above runs without you.";

export const FEATURES_SUBCOPY_LINE_ONE =
  "GitHub, Linear, and Slack go in. Changelogs, launch posts, and social come out.";

export const FEATURES_SUBCOPY_LINE_TWO =
  "In your voice, on autopilot. Here's what's doing the work.";

export const FEATURES_BRAND_COPY: FeaturesCardCopy = {
  title: "On-brand by default",
  description:
    "Trained on your voice and visual identity, so everything sounds like you wrote it: because it basically did.",
};

export const FEATURES_AUTOMATIONS_COPY: FeaturesCardCopy = {
  title: "Event Automations",
  description:
    "Trigger content the moment you merge a PR or close a Linear issue. Your release writes itself.",
};

export const FEATURES_ASSETS_COPY: FeaturesCardCopy = {
  title: "Assets on autopilot",
  description:
    "Every post ships with a matching image generated in your colors and style, not stock filler.",
};

export const FEATURES_PUBLISH_COPY: FeaturesCardCopy = {
  title: "Publish from anywhere you work",
  description:
    "Full API, MCP server and CLI. Write Notra into your stack or hand it to your agents.",
};

export const FEATURES_GITHUB_CONNECT: FeaturesConnectCard = {
  name: "GitHub",
  description:
    "Connect GitHub repositories for AI-powered changelogs, blog posts, and tweets",
};

export const FEATURES_LINEAR_CONNECT: FeaturesConnectCard = {
  name: "Linear",
  description: "Sync issues and updates from Linear for automated content",
};

export const FEATURES_PERMISSIONS: FeaturesPermission[] = [
  {
    name: "Posts",
    description: "Read and manage your posts and drafts",
    active: "write",
  },
  {
    name: "Brand identities",
    description: "Read and manage saved brand voices",
    active: "write",
  },
  {
    name: "Integrations",
    description: "Read and manage connected content sources",
    active: "read",
  },
  {
    name: "Schedules",
    description: "Read and manage scheduled content generation",
    active: "write",
  },
  {
    name: "Event triggers",
    description: "Read and manage event-based content generation",
    active: "read",
  },
  {
    name: "Chats",
    description: "Read and manage chat sessions",
    active: "read",
  },
  {
    name: "Skills",
    description: "Read and manage your skills",
    active: "read",
  },
];

export const FEATURES_MCP_TOOL: FeaturesToolCard = {
  title: "MCP Server",
  description:
    "Connect Claude, Cursor, and other MCP clients to read and write your content.",
};

export const FEATURES_CLI_TOOL: FeaturesToolCard = {
  title: "CLI",
  description:
    "Script and automate your workflow from the terminal with full access.",
};
