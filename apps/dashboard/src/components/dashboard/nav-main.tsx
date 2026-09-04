"use client";

import { usePathname } from "next/navigation";

import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { SIDEBAR_MODE_HOME_LINKS } from "@/constants/nav";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { useSidebarMode } from "@/lib/hooks/use-sidebar-mode";

import { NavGeo } from "./nav-geo";
import { NavModePrimaryAction } from "./nav-mode-primary-action";
import { NavModeSwitch } from "./nav-mode-switch";
import { NavStudio } from "./nav-studio";
import { SidebarSwap } from "./sidebar-swap";

export function NavMain() {
  const { activeOrganization } = useOrganizationsContext();
  const pathname = usePathname();
  const [projectParam] = useGeoProjectQueryState();
  const route = pathname.split("/").filter(Boolean).slice(1).join("/");
  const { mode, setMode, pendingMode } = useSidebarMode(route || undefined);

  if (!activeOrganization?.slug) {
    return null;
  }

  const slug = activeOrganization.slug;
  const projectId = projectParam ?? undefined;

  // While a pick is in flight the panels have already swapped but `pathname`
  // still points at the old route, so every item would resolve as inactive and
  // the highlight would pop in once navigation lands. Resolve against where the
  // pick is heading instead, so the highlight arrives with the panel.
  const navPathname = pendingMode
    ? `/${slug}${SIDEBAR_MODE_HOME_LINKS[pendingMode]}`
    : pathname;

  return (
    <>
      <NavModeSwitch
        mode={mode}
        onModeChange={setMode}
        projectId={projectId}
        slug={slug}
      />
      <NavModePrimaryAction
        mode={mode}
        organizationId={activeOrganization.id}
        projectId={projectId}
        slug={slug}
      />
      {/*
        Both mode panels stay mounted so the swoosh has something to fade
        between. Only the active one sits in flow — a stacked layout would
        grow to whichever panel is taller, including while hidden async
        content (recent posts, entitlements) settles.
      */}
      <SidebarSwap
        activeId={mode}
        className="overflow-hidden"
        items={[
          {
            id: "geo",
            side: "left",
            children: (
              <NavGeo
                pathname={navPathname}
                projectId={projectId}
                slug={slug}
              />
            ),
          },
          {
            id: "studio",
            side: "right",
            children: (
              <NavStudio
                organizationId={activeOrganization.id}
                pathname={navPathname}
                slug={slug}
              />
            ),
          },
        ]}
        keepMounted
      />
    </>
  );
}
