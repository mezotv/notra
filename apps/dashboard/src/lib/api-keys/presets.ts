import {
  CommandLineIcon,
  PlugSocketIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import type { ConnectedCardItem } from "@notra/ui/components/shared/connected-cards";
import type { ApiKeyCardVariant, ApiKeyPreset } from "@/types/api-keys";

const DOCS_BASE_URL = "https://docs.usenotra.com";

export const API_KEY_PRESETS: ApiKeyPreset[] = [
  {
    id: "mcp",
    icon: PlugSocketIcon,
    accentIcon:
      "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
    title: "MCP Server",
    description:
      "Connect Claude, Cursor, and other MCP clients to read and write your content.",
    docsHref: `${DOCS_BASE_URL}/mcp`,
    defaultName: "MCP Server",
    permission: "api.write",
    expiration: "never",
  },
  {
    id: "sdk",
    icon: SourceCodeIcon,
    accentIcon: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
    title: "SDK",
    description:
      "Pull your data programmatically with the TypeScript and Python SDKs.",
    docsHref: `${DOCS_BASE_URL}/sdk`,
    defaultName: "SDK",
    permission: "api.read",
    expiration: "never",
  },
  {
    id: "cli",
    icon: CommandLineIcon,
    accentIcon:
      "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
    title: "CLI",
    description:
      "Script and automate your workflow from the terminal with full access.",
    docsHref: `${DOCS_BASE_URL}/cli`,
    defaultName: "CLI",
    permission: "api.write",
    expiration: "never",
  },
];

export const API_KEY_CARD_ITEMS: ConnectedCardItem[] = API_KEY_PRESETS.map(
  (preset) => ({
    id: preset.id,
    icon: preset.icon,
    accentIcon: preset.accentIcon,
    title: preset.title,
    description: preset.description,
    docsHref: preset.docsHref,
  })
);

export const API_KEY_CARD_VARIANTS: ApiKeyCardVariant[] = [
  "segmented",
  "elevated",
  "accent",
];
