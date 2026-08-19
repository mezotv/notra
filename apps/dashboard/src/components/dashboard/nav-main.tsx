"use client";
import { useFlag } from "@databuddy/sdk/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { SOCIAL_ANALYTICS_FLAG_KEY } from "@/constants/analytics";
import {
  NAV_CATEGORY_LABELS,
  NAV_DRILLDOWN_ITEMS,
  NAV_MAIN_ITEMS,
} from "@/constants/nav";
import type { NavMainItem } from "@/types/components/nav";
import { isAnalyticsVisibleInNav } from "@/utils/analytics-flag";
import { resolveActiveNavLink, resolveMainNavGroups } from "@/utils/nav";
import { CollapsibleSidebarGroup } from "./collapsible-nav-group";
import { SidebarLabel } from "./sidebar-label";

function NavGroup({
  items,
  slug,
  label,
  activeLink,
}: {
  items: NavMainItem[];
  slug: string;
  label?: string;
  activeLink: string | null;
}) {
  if (items.length === 0) {
    return null;
  }

  const menu = (
    <SidebarMenu>
      {items.map((item) => {
        const href = `/${slug}${item.link}`;
        const isActive = item.link === activeLink;
        return (
          <SidebarMenuItem key={item.link}>
            <SidebarMenuButton
              isActive={isActive}
              render={
                <Link href={href}>
                  <HugeiconsIcon icon={item.icon} />
                  <SidebarLabel>{item.label}</SidebarLabel>
                  {item.badge && (
                    <Badge
                      className="ml-auto h-[1.125rem] px-[0.375rem] text-[0.625rem] text-muted-foreground group-data-[collapsible=icon]:hidden"
                      variant="secondary"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              }
              tooltip={item.label}
            />
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  if (label) {
    return (
      <CollapsibleSidebarGroup label={label}>{menu}</CollapsibleSidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>{menu}</SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavMain() {
  const { activeOrganization } = useOrganizationsContext();
  const pathname = usePathname();
  const analyticsFlag = useFlag(SOCIAL_ANALYTICS_FLAG_KEY);
  const analyticsVisible = isAnalyticsVisibleInNav(analyticsFlag.on);

  if (!activeOrganization?.slug) {
    return null;
  }

  const slug = activeOrganization.slug;
  const { rootItems, workspaceItems } = resolveMainNavGroups(analyticsVisible);
  const activeLink = resolveActiveNavLink(
    pathname,
    slug,
    NAV_MAIN_ITEMS.map((item) => item.link)
  );

  return (
    <>
      <NavGroup activeLink={activeLink} items={rootItems} slug={slug} />
      <NavGroup
        activeLink={activeLink}
        items={workspaceItems}
        label={NAV_CATEGORY_LABELS.workspace}
        slug={slug}
      />
      <NavGroup activeLink={null} items={NAV_DRILLDOWN_ITEMS} slug={slug} />
    </>
  );
}
