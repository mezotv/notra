import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

export type SettingsSectionId =
  | "account"
  | "general"
  | "members"
  | "notifications"
  | "attachments"
  | "billing"
  | "credits"
  | "logs"
  | "geo"
  | "geo-brand"
  | "geo-languages"
  | "geo-models";

export type SettingsNavGroupId = "account" | "organization" | "geo";

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: IconSvgElement;
  keywords: readonly string[];
  requiresAiCredits?: boolean;
}

export interface SettingsNavGroup {
  id: SettingsNavGroupId;
  label: string;
  items: readonly SettingsNavItem[];
}

export interface SettingsModalNavProps {
  groups: readonly SettingsNavGroup[];
  activeSection: SettingsSectionId;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (section: SettingsSectionId) => void;
  searchInputId: string;
}

export interface SettingsPaneProps {
  children: ReactNode;
  className?: string;
  titleAccessory?: ReactNode;
}

export interface SettingsModalBodyProps {
  activeSection: SettingsSectionId;
  closeSettings: () => void;
  descriptionId: string;
  isOpen: boolean;
  section: SettingsSectionId | null;
  titleId: string;
}

export interface SettingsHeaderContextValue {
  titleAccessory: ReactNode;
  setTitleAccessory: (node: ReactNode) => void;
}

export type SettingsUrlSearchParams = Record<
  string,
  string | string[] | undefined
>;
