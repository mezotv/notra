import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

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
  /** Route to resolve the active item against; may lead the real pathname. */
  pathname: string;
  projectId?: string;
}

export interface NavStudioProps {
  slug: string;
  organizationId: string;
  /** Route to resolve the active item against; may lead the real pathname. */
  pathname: string;
}

export interface NavModePrimaryActionProps {
  mode: SidebarMode;
  slug: string;
  organizationId: string;
  projectId?: string;
}

export interface NavModePrimaryActionContentProps extends NavModePrimaryActionProps {
  pathname: string;
}

export interface HeaderBreadcrumbsProps {
  pathname: string;
}

export interface BrandIdentityHeaderBreadcrumbsProps {
  id: string;
  slug: string | undefined;
}

export interface GenericHeaderBreadcrumbsProps {
  breadcrumbSegments: string[];
  id: string;
  isChatDetail: boolean;
  isCollectionDetail: boolean;
  isContentDetail: boolean;
  isNonOrgPath: boolean;
  segments: string[];
  slug: string | undefined;
}

export interface GeoHeaderBreadcrumbsProps {
  breadcrumbSegments: string[];
  id: string;
  segments: string[];
  slug: string | undefined;
}

export interface HeaderSearchProps {
  onOpen: () => void;
}

export interface HeaderActionsProps {
  feedbackOpen: boolean;
  setFeedbackOpen: (open: boolean) => void;
}

export interface NavRecentContentProps {
  slug: string;
  organizationId: string;
}

export interface NavUtilityProps {
  slug: string;
}

/**
 * A mode the user picked that the route has not caught up with yet. Scoped to
 * the section it was picked from so it stops applying once the route moves on.
 */
export interface PendingSidebarMode {
  mode: SidebarMode;
  section: string | undefined;
}

export interface UseSidebarModeResult {
  mode: SidebarMode;
  setMode: (mode: SidebarMode) => void;
  /** Set while the route has not caught up with the user's pick, else null. */
  pendingMode: SidebarMode | null;
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

export type SidebarSwapSide = "left" | "right";

export interface SidebarSwapItem {
  id: string;
  side: SidebarSwapSide;
  className?: string;
  children: ReactNode;
}

export interface SidebarSwapProps {
  activeId: string;
  items: readonly SidebarSwapItem[];
  /** Keep every panel mounted. Use when both sides stay cheap to hold. */
  keepMounted?: boolean;
  className?: string;
}
