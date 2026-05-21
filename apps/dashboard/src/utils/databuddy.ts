import { RESERVED_ORGANIZATION_SLUGS } from "@/constants/organization";

export const DATABUDDY_DASHBOARD_MASK_PATTERNS = ["/*"];

const ABSOLUTE_URL_REGEX = /^[a-z][a-z\d+.-]*:\/\//i;

interface DatabuddyFilterEvent {
  path?: unknown;
}

function getFirstPathSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

function isReservedOrganizationSlug(slug: string): boolean {
  return RESERVED_ORGANIZATION_SLUGS.includes(
    slug as (typeof RESERVED_ORGANIZATION_SLUGS)[number]
  );
}

function shouldMaskPathname(pathname: string): boolean {
  const firstSegment = getFirstPathSegment(pathname);
  return Boolean(firstSegment) && !isReservedOrganizationSlug(firstSegment);
}

function maskPathname(pathname: string): string {
  if (!shouldMaskPathname(pathname)) {
    return pathname;
  }

  const segments = pathname.split("/").filter(Boolean);
  segments[0] = "*";

  return `/${segments.join("/")}`;
}

function formatUrl(url: URL, absolute: boolean): string {
  if (absolute) {
    return url.toString();
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function normalizeDatabuddyPath(path: string): string {
  const absolutePath = ABSOLUTE_URL_REGEX.test(path);
  const currentUrl =
    typeof window === "undefined" ? undefined : new URL(window.location.href);
  const url = new URL(path, currentUrl?.origin ?? "https://app.usenotra.com");

  if (getFirstPathSegment(url.pathname) === "*" && currentUrl) {
    return shouldMaskPathname(currentUrl.pathname)
      ? formatUrl(url, absolutePath)
      : formatUrl(currentUrl, absolutePath);
  }

  url.pathname = maskPathname(url.pathname);
  return formatUrl(url, absolutePath);
}

export function normalizeDatabuddyEventPath(event: DatabuddyFilterEvent) {
  if (typeof event.path !== "string") {
    return true;
  }

  event.path = normalizeDatabuddyPath(event.path);
  return true;
}
