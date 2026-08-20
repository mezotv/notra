"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_CATEGORY_LABELS, NAV_ITEMS_BY_CATEGORY } from "@/constants/nav";
import type { NavUtilityProps } from "@/types/components/nav";
import { resolveActiveNavLink } from "@/utils/nav";
import { SidebarLabel } from "./sidebar-label";

export function NavUtility({ slug }: NavUtilityProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS_BY_CATEGORY.utility;
  const activeLink = resolveActiveNavLink(
    pathname,
    slug,
    items.map((item) => item.link)
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <SidebarLabel>{NAV_CATEGORY_LABELS.utility}</SidebarLabel>
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuButton
            isActive={item.link === activeLink}
            key={item.link}
            render={
              <Link href={`/${slug}${item.link}`}>
                <HugeiconsIcon icon={item.icon} />
                <SidebarLabel>{item.label}</SidebarLabel>
              </Link>
            }
            tooltip={item.label}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
