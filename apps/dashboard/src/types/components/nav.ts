import type { IconSvgElement } from "@hugeicons/react";

export type NavMainCategory = "none" | "workspace" | "automation" | "utility";

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
