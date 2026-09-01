"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
} from "@notra/ui/components/ui/sidebar";
import { usePathname } from "next/navigation";

import { NAV_CATEGORY_LABELS, NAV_UTILITY_LINKS } from "@/constants/nav";
import type { NavUtilityProps } from "@/types/components/nav";
import { resolveActiveNavLink } from "@/utils/nav";

import { NavList } from "./nav-list";
import { SidebarLabel } from "./sidebar-label";

export function NavUtility({ slug }: NavUtilityProps) {
  const pathname = usePathname();
  const activeLink = resolveActiveNavLink(pathname, slug, NAV_UTILITY_LINKS);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <SidebarLabel>{NAV_CATEGORY_LABELS.utility}</SidebarLabel>
      </SidebarGroupLabel>
      <NavList activeLink={activeLink} links={NAV_UTILITY_LINKS} slug={slug} />
    </SidebarGroup>
  );
}
