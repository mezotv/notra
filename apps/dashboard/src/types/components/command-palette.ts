import type { IconSvgElement } from "@hugeicons/react";

import type { CommandPaletteOpenSource } from "@/types/analytics/studio-events";

export interface CommandPaletteContextValue {
  hasOpened: boolean;
  open: boolean;
  openSource: CommandPaletteOpenSource | null;
  setOpen: (open: boolean, source?: CommandPaletteOpenSource) => void;
}

export interface CommandPaletteStateAction {
  open: boolean;
  source: CommandPaletteOpenSource;
}

export interface CommandPaletteState {
  hasOpened: boolean;
  open: boolean;
  openSource: CommandPaletteOpenSource | null;
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

export type CommandPaletteAiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "navigating"; label: string }
  | { status: "error" };

export interface EntityHit {
  key: string;
  label: string;
  sublabel?: string;
  icon: IconSvgElement;
  path: string;
  keywords: string[];
}

export type EntitySection =
  | "Posts"
  | "Brand voices"
  | "References"
  | "Integrations";

export interface CommandPaletteDialogProps {
  aiModifierLabel: string;
  aiState: CommandPaletteAiState;
  entityHitsBySection: Record<EntitySection, EntityHit[]>;
  hasAiCredits: boolean;
  hasQuery: boolean;
  isLoading: boolean;
  navigate: (path: string) => void;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  open: boolean;
  openChatWithQuery: (query: string) => void;
  openFeedback: () => void;
  query: string;
  runAiSearch: () => Promise<void>;
  slug: string;
  trimmedQuery: string;
}

export interface CommandPaletteResultsProps {
  aiModifierLabel: string;
  aiState: CommandPaletteAiState;
  entityHitsBySection: Record<EntitySection, EntityHit[]>;
  hasAiCredits: boolean;
  hasQuery: boolean;
  isLoading: boolean;
  navigate: (path: string) => void;
  openChatWithQuery: (query: string) => void;
  openFeedback: () => void;
  query: string;
  runAiSearch: () => Promise<void>;
  slug: string;
  trimmedQuery: string;
}

export interface CommandPaletteLoadingProps {
  aiState: CommandPaletteAiState;
  query: string;
}
