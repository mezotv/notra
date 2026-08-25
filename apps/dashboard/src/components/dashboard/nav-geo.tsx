"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
} from "@notra/ui/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { GEO_UPGRADE_TOOLTIP, GEO_WRITER_NAV_LINK } from "@/constants/geo";
import {
  NAV_CATEGORY_LABELS,
  NAV_GEO_LINKS,
  NAV_GEO_VISIBILITY_LINKS,
  NAV_PRIMARY_ACTIONS,
} from "@/constants/nav";
import { useNavVisibility } from "@/lib/hooks/use-nav-visibility";
import { useHasGeoFeature } from "@/lib/hooks/use-plan";
import type { NavGeoProps } from "@/types/components/nav";
import { geoNavHref } from "@/utils/geo-paths";
import { resolveActiveNavLink, resolveGeoImproveLinks } from "@/utils/nav";
import { NavList } from "./nav-list";
import { NavLockHint } from "./nav-lock-hint";
import { NavPrimaryAction } from "./nav-primary-action";
import { SidebarLabel } from "./sidebar-label";

export function NavGeo({ slug, projectId }: NavGeoProps) {
  const pathname = usePathname();
  const visibility = useNavVisibility();
  const { isLocked: geoLocked } = useHasGeoFeature();
  const activeLink = resolveActiveNavLink(pathname, slug, NAV_GEO_LINKS);
  const showWriteAction = visibility.writer && !geoLocked;
  const improveLinks = resolveGeoImproveLinks(showWriteAction);
  const writeAction = NAV_PRIMARY_ACTIONS.geo;

  return (
    <>
      {showWriteAction && (
        <NavPrimaryAction
          href={geoNavHref(slug, GEO_WRITER_NAV_LINK, projectId)}
          icon={writeAction.icon}
          label={writeAction.label}
        />
      )}
      <SidebarGroup>
        <SidebarGroupLabel>
          <SidebarLabel>{NAV_CATEGORY_LABELS.visibility}</SidebarLabel>
          {geoLocked && <NavLockHint message={GEO_UPGRADE_TOOLTIP} />}
        </SidebarGroupLabel>
        <NavList
          activeLink={activeLink}
          geoLocked={geoLocked}
          links={NAV_GEO_VISIBILITY_LINKS}
          projectId={projectId}
          slug={slug}
          visibility={visibility}
        />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>
          <SidebarLabel>{NAV_CATEGORY_LABELS.improve}</SidebarLabel>
        </SidebarGroupLabel>
        <NavList
          activeLink={activeLink}
          geoLocked={geoLocked}
          links={improveLinks}
          projectId={projectId}
          slug={slug}
          visibility={visibility}
        />
      </SidebarGroup>
    </>
  );
}
