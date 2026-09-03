import type { IconSvgElement } from "@hugeicons/react";

import type { CommandPaletteOpenSource } from "@/types/analytics/studio-events";

export interface CommandPaletteContextValue {
  hasOpened: boolean;
  open: boolean;
  openSource: CommandPaletteOpenSource | null;
  setOpen: (open: boolean, source?: CommandPaletteOpenSource) => void;
}

export type CommandSection =
  | "Navigation"
  | "GEO"
  | "Workspace"
  | "Automation"
  | "Manage"
  | "Settings";

export interface CommandRoute {
  id: string;
  label: string;
  keywords: string[];
  icon: IconSvgElement;
  section: CommandSection;
  path: (slug: string) => string;
  requiresAiCredits?: boolean;
}

export type AiResult =
  | { action: "navigate"; path: string; reason: string }
  | { action: "chat"; path: null; reason: string };

export interface EntityHit {
  key: string;
  label: string;
  sublabel?: string;
  icon: IconSvgElement;
  path: string;
  keywords: string[];
}
