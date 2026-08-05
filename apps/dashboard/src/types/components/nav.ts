import type { IconSvgElement } from "@hugeicons/react";

export type NavMainCategory =
  | "none"
  | "workspace"
  | "automation"
  | "geo"
  | "manage";

export interface NavItem {
  link: string;
  icon: IconSvgElement;
  label: string;
}

export interface NavMainItem extends NavItem {
  category: NavMainCategory;
  badge?: string;
}
