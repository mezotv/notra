"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { useStoredSidebarMode } from "@/lib/hooks/use-sidebar-mode";
import { isOrgRootPath, resolveOrgRootRedirect } from "@/utils/nav";

/**
 * Fallback for a GEO pick that only lives in localStorage (no cookie yet).
 * The org-root page already server-redirects when the cookie is present.
 */
export function RestoreSidebarHome() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrganization } = useOrganizationsContext();
  const [projectParam] = useGeoProjectQueryState();
  const storedMode = useStoredSidebarMode();
  const slug = activeOrganization?.slug;
  const redirectTo =
    slug && isOrgRootPath(pathname, slug)
      ? resolveOrgRootRedirect(slug, storedMode, projectParam ?? undefined)
      : null;

  useEffect(() => {
    if (!redirectTo) {
      return;
    }
    // react-doctor-disable-next-line nextjs-no-client-side-redirect -- fallback when the mode cookie is missing
    router.replace(redirectTo);
  }, [redirectTo, router]);

  return null;
}
