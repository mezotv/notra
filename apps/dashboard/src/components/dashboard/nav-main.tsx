"use client";

import { usePathname } from "next/navigation";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { useSidebarMode } from "@/lib/hooks/use-sidebar-mode";
import { NavGeo } from "./nav-geo";
import { NavModeSwitch } from "./nav-mode-switch";
import { NavStudio } from "./nav-studio";

export function NavMain() {
  const { activeOrganization } = useOrganizationsContext();
  const pathname = usePathname();
  const [projectParam] = useGeoProjectQueryState();
  const section = pathname.split("/").filter(Boolean)[1];
  const { mode, setMode } = useSidebarMode(section);

  if (!activeOrganization?.slug) {
    return null;
  }

  const slug = activeOrganization.slug;
  const projectId = projectParam ?? undefined;

  return (
    <>
      <NavModeSwitch
        mode={mode}
        onModeChange={setMode}
        projectId={projectId}
        slug={slug}
      />
      {mode === "geo" ? (
        <NavGeo projectId={projectId} slug={slug} />
      ) : (
        <NavStudio organizationId={activeOrganization.id} slug={slug} />
      )}
    </>
  );
}
