import type { IconSvgElement } from "@hugeicons/react";

export type SidebarMode = "geo" | "studio";

export type NavGroupKey = "visibility" | "improve" | "automation" | "utility";

export interface NavItem {
  link: string;
  icon: IconSvgElement;
  label: string;
}

export interface NavMainItem extends NavItem {
  badge?: string;
}

export interface SidebarModeOption {
  id: SidebarMode;
  label: string;
  icon: IconSvgElement;
}

export interface NavPrimaryActionConfig {
  label: string;
  icon: IconSvgElement;
}

export interface NavVisibility {
  iris: boolean;
  writer: boolean;
  analytics: boolean;
}

export interface NavListProps {
  links: readonly string[];
  slug: string;
  activeLink: string | null;
  projectId?: string;
  geoLocked?: boolean;
  visibility?: NavVisibility;
}

export interface NavModeSwitchProps {
  mode: SidebarMode;
  slug: string;
  projectId?: string;
  onModeChange: (mode: SidebarMode) => void;
}

export interface NavGeoProps {
  slug: string;
  projectId?: string;
}

export interface NavStudioProps {
  slug: string;
  organizationId: string;
}

export interface NavRecentContentProps {
  slug: string;
  organizationId: string;
}

export interface NavSearchProps {
  isApplePlatform: boolean;
  onOpen: () => void;
}

export interface NavPrimaryActionProps {
  label: string;
  icon: IconSvgElement;
  href?: string;
  onClick?: () => void;
}

export interface NavUtilityProps {
  slug: string;
}

export interface UseSidebarModeResult {
  mode: SidebarMode;
  setMode: (mode: SidebarMode) => void;
}

export interface NavSettingsItem {
  label: string;
  url: string;
  icon: IconSvgElement;
  requiresAiCredits?: boolean;
}

export interface NavSettingsProps {
  slug: string;
}

export interface NavLockHintProps {
  message: string;
  className?: string;
}
