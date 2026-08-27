"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";

import { AGENT_FEEDBACK_NAV_LINK } from "@/constants/agent-feedback";
import { GEO_UPGRADE_TOOLTIP } from "@/constants/geo";
import type { NavListProps } from "@/types/components/nav";
import { geoNavHref, isGeoDashboardPath } from "@/utils/geo-paths";
import { resolveNavItems } from "@/utils/nav";

import { NavLockHint } from "./nav-lock-hint";
import { SidebarLabel } from "./sidebar-label";

export function NavList({
  links,
  slug,
  activeLink,
  projectId,
  geoLocked = false,
  visibility,
}: NavListProps) {
  const items = resolveNavItems(links, visibility);

  if (items.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isGeoItem = isGeoDashboardPath(item.link);
        const prefetch =
          isGeoItem || item.link === AGENT_FEEDBACK_NAV_LINK ? true : undefined;
        return (
          <SidebarMenuItem key={item.link}>
            <SidebarMenuButton
              isActive={item.link === activeLink}
              render={
                <Link
                  href={geoNavHref(slug, item.link, projectId)}
                  prefetch={prefetch}
                >
                  <HugeiconsIcon icon={item.icon} />
                  <SidebarLabel>{item.label}</SidebarLabel>
                  {item.badge && (
                    <Badge
                      className="text-muted-foreground ml-auto h-[1.125rem] px-[0.375rem] text-[0.625rem] group-data-[collapsible=icon]:hidden"
                      variant="secondary"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {geoLocked && isGeoItem && (
                    <NavLockHint message={GEO_UPGRADE_TOOLTIP} />
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
}
