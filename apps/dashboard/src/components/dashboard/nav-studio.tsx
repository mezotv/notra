"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
} from "@notra/ui/components/ui/sidebar";

import {
  NAV_AUTOMATION_LINKS,
  NAV_CATEGORY_LABELS,
  NAV_STUDIO_ALL_LINKS,
  NAV_STUDIO_LINKS,
} from "@/constants/nav";
import { useNavVisibility } from "@/lib/hooks/use-nav-visibility";
import type { NavStudioProps } from "@/types/components/nav";
import { resolveActiveNavLink } from "@/utils/nav";

import { CollapsibleSidebarGroup } from "./collapsible-nav-group";
import { NavList } from "./nav-list";
import { NavRecentContent } from "./nav-recent-content";

export function NavStudio({ slug, organizationId, pathname }: NavStudioProps) {
  const visibility = useNavVisibility();
  const activeLink = resolveActiveNavLink(pathname, slug, NAV_STUDIO_ALL_LINKS);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <NavList
            activeLink={activeLink}
            links={NAV_STUDIO_LINKS}
            slug={slug}
            visibility={visibility}
          />
        </SidebarGroupContent>
      </SidebarGroup>
      <NavRecentContent organizationId={organizationId} slug={slug} />
      <CollapsibleSidebarGroup label={NAV_CATEGORY_LABELS.automation}>
        <NavList
          activeLink={activeLink}
          links={NAV_AUTOMATION_LINKS}
          slug={slug}
          visibility={visibility}
        />
      </CollapsibleSidebarGroup>
    </>
  );
}
