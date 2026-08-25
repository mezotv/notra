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
import { AGENT_FEEDBACK_NAV_LINK } from "@/constants/agent-feedback";
import { SOCIAL_ANALYTICS_FLAG_KEY } from "@/constants/analytics";
import { GEO_UPGRADE_TOOLTIP } from "@/constants/geo";
import {
  NAV_CATEGORY_LABELS,
  NAV_DRILLDOWN_ITEMS,
  NAV_MAIN_ITEMS,
} from "@/constants/nav";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { useHasGeoFeature } from "@/lib/hooks/use-plan";
import type { NavMainItem } from "@/types/components/nav";
import { isAnalyticsVisibleInNav } from "@/utils/analytics-flag";
import { geoNavHref, isGeoDashboardPath } from "@/utils/geo-paths";
import { resolveActiveNavLink, resolveMainNavGroups } from "@/utils/nav";
import { CollapsibleSidebarGroup } from "./collapsible-nav-group";
import { NavLockHint } from "./nav-lock-hint";
import { SidebarLabel } from "./sidebar-label";

function NavGroup({
  items,
  slug,
  label,
  activeLink,
  projectId,
  geoLocked,
}: {
  items: NavMainItem[];
  slug: string;
  label?: string;
  activeLink: string | null;
  projectId?: string;
  geoLocked: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  const menu = (
    <SidebarMenu>
      {items.map((item) => {
        const href = geoNavHref(slug, item.link, projectId);
        const isActive = item.link === activeLink;
        const showLock = geoLocked && isGeoDashboardPath(item.link);
        return (
          <SidebarMenuItem key={`${item.link}:${projectId ?? ""}`}>
            <SidebarMenuButton
              isActive={isActive}
              render={
                <Link
                  href={href}
                  prefetch={
                    item.link.startsWith("/geo") ||
                    item.link === AGENT_FEEDBACK_NAV_LINK
                      ? true
                      : undefined
                  }
                >
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
                  {showLock && <NavLockHint message={GEO_UPGRADE_TOOLTIP} />}
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
  const [projectParam] = useGeoProjectQueryState();
  const analyticsFlag = useFlag(SOCIAL_ANALYTICS_FLAG_KEY);
  const analyticsVisible = isAnalyticsVisibleInNav(analyticsFlag.on);
  const { isLocked: geoLocked } = useHasGeoFeature();

  if (!activeOrganization?.slug) {
    return null;
  }

  const slug = activeOrganization.slug;
  const projectId = projectParam ?? undefined;
  const { rootItems, workspaceItems } = resolveMainNavGroups(analyticsVisible);
  const activeLink = resolveActiveNavLink(
    pathname,
    slug,
    NAV_MAIN_ITEMS.map((item) => item.link)
  );

  return (
    <>
      <NavGroup
        activeLink={activeLink}
        geoLocked={geoLocked}
        items={rootItems}
        projectId={projectId}
        slug={slug}
      />
      <NavGroup
        activeLink={activeLink}
        geoLocked={geoLocked}
        items={workspaceItems}
        label={NAV_CATEGORY_LABELS.workspace}
        projectId={projectId}
        slug={slug}
      />
      <NavGroup
        activeLink={null}
        geoLocked={geoLocked}
        items={NAV_DRILLDOWN_ITEMS}
        projectId={projectId}
        slug={slug}
      />
    </>
  );
}
