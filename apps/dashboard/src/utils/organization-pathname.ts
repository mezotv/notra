import { NON_ORGANIZATION_ROUTE_SEGMENTS } from "@/constants/organization-routes";

export function getOrganizationSlugFromPathname(
  pathname: string | null
): string | null {
  if (!pathname) {
    return null;
  }
  const [firstSegment] = pathname.split("/").filter(Boolean);
  if (!firstSegment || NON_ORGANIZATION_ROUTE_SEGMENTS.has(firstSegment)) {
    return null;
  }
  return firstSegment;
}
