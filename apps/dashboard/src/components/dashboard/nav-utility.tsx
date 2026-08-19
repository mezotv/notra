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
      <SidebarGroupLabel>{NAV_CATEGORY_LABELS.utility}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuButton
            isActive={item.link === activeLink}
            key={item.link}
            render={
              <Link href={`/${slug}${item.link}`}>
                <HugeiconsIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            }
            tooltip={item.label}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
