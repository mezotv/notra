import type { IconSvgElement } from "@hugeicons/react";
import type { OrganizationScope } from "@notra/db/types/roles";

export type NavMainCategory = "none" | "workspace" | "automation" | "manage";

export interface NavItem {
  link: string;
  icon: IconSvgElement;
  label: string;
}

export interface NavMainItem extends NavItem {
  category: NavMainCategory;
  badge?: string;
  requiredScope?: OrganizationScope;
}

export interface NavGroupProps {
  items: NavMainItem[];
  slug: string;
  label?: string;
  pathname: string;
  hasScope: (scope: OrganizationScope) => boolean;
}
