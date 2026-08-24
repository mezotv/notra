import type { IconSvgElement } from "@hugeicons/react";

export type NavMainCategory =
  | "none"
  | "workspace"
  | "automation"
  | "geo"
  | "utility";

export type NavDrilldownCategory = Exclude<
  NavMainCategory,
  "none" | "workspace" | "utility"
>;

export interface NavCategoryProps {
  category: NavDrilldownCategory;
  slug: string;
}

export interface NavUtilityProps {
  slug: string;
}

export interface NavItem {
  link: string;
  icon: IconSvgElement;
  label: string;
}

export interface NavMainItem extends NavItem {
  category: NavMainCategory;
  badge?: string;
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
