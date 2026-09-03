import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import {
  LAST_VISITED_ORGANIZATION_COOKIE,
  LAST_VISITED_ORGANIZATION_COOKIE_MAX_AGE,
  LAST_VISITED_PROJECT_COOKIE,
  LAST_VISITED_PROJECT_COOKIE_MAX_AGE,
  LAST_VISITED_PROJECT_COOKIE_MAX_ORGANIZATIONS,
  SIDEBAR_MODE_COOKIE,
  SIDEBAR_MODE_COOKIE_MAX_AGE,
} from "@/constants/cookies";
import type { SidebarMode } from "@/types/components/nav";
import { isSidebarMode } from "@/utils/nav";

type CookieJar = RequestCookies | ReadonlyRequestCookies;

function parseLastVisitedProjects(value: string | undefined) {
  if (!value) {
    return new Map<string, string>();
  }

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new Map<string, string>();
    }
    return new Map(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    );
  } catch {
    const [storedSlug, projectId, extra] = value.split(":");
    if (!(storedSlug && projectId) || extra !== undefined) {
      return new Map<string, string>();
    }
    try {
      return new Map([
        [decodeURIComponent(storedSlug), decodeURIComponent(projectId)],
      ]);
    } catch {
      return new Map<string, string>();
    }
  }
}

export function parseLastVisitedProject(
  value: string | undefined,
  organizationSlug: string
): string | undefined {
  return parseLastVisitedProjects(value).get(organizationSlug);
}

export function updateLastVisitedProjects(
  value: string | undefined,
  organizationSlug: string,
  projectId: string
): string {
  const projects = parseLastVisitedProjects(value);
  projects.delete(organizationSlug);
  projects.set(organizationSlug, projectId);

  const recentProjects = [...projects.entries()].slice(
    -LAST_VISITED_PROJECT_COOKIE_MAX_ORGANIZATIONS
  );
  return encodeURIComponent(JSON.stringify(Object.fromEntries(recentProjects)));
}

function readClientCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return;
  }

  const prefix = `${name}=`;
  // biome-ignore lint/suspicious/noDocumentCookie: The active project must be restored before the next navigation
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));
  return entry?.slice(prefix.length);
}

async function setClientCookie(
  name: string,
  value: string,
  maxAge: number
): Promise<void> {
  const isSecure =
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" ||
      process.env.NODE_ENV === "production");

  if (
    typeof document === "undefined" &&
    typeof window !== "undefined" &&
    "cookieStore" in window
  ) {
    const cookieOptions: CookieInit = {
      name,
      value,
      expires: Date.now() + maxAge * 1000,
      path: "/",
      sameSite: "lax",
    };

    await cookieStore.set(cookieOptions).catch(() => {
      // Failed to set cookie - silently continue
    });
    return;
  }

  if (typeof document !== "undefined") {
    const secureFlag = isSecure ? "; Secure" : "";
    // biome-ignore lint/suspicious/noDocumentCookie: Navigation must see the updated cookie synchronously
    document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax${secureFlag}`;
  }
}

export const setLastVisitedOrganization = async (
  organizationSlug: string,
  maxAge: number = LAST_VISITED_ORGANIZATION_COOKIE_MAX_AGE
) => {
  await setClientCookie(
    LAST_VISITED_ORGANIZATION_COOKIE,
    organizationSlug,
    maxAge
  );
};

export const getLastVisitedOrganization = (
  cookies: CookieJar
): string | undefined => cookies.get(LAST_VISITED_ORGANIZATION_COOKIE)?.value;

export const setLastVisitedProject = async (
  organizationSlug: string,
  projectId: string,
  maxAge: number = LAST_VISITED_PROJECT_COOKIE_MAX_AGE
): Promise<void> => {
  await setClientCookie(
    LAST_VISITED_PROJECT_COOKIE,
    updateLastVisitedProjects(
      readClientCookie(LAST_VISITED_PROJECT_COOKIE),
      organizationSlug,
      projectId
    ),
    maxAge
  );
};

export const getLastVisitedProject = (
  cookies: CookieJar,
  organizationSlug: string
): string | undefined =>
  parseLastVisitedProject(
    cookies.get(LAST_VISITED_PROJECT_COOKIE)?.value,
    organizationSlug
  );

export const getLastVisitedProjectFromClient = (
  organizationSlug: string
): string | undefined =>
  parseLastVisitedProject(
    readClientCookie(LAST_VISITED_PROJECT_COOKIE),
    organizationSlug
  );

export const setSidebarModeCookie = async (
  mode: SidebarMode,
  maxAge: number = SIDEBAR_MODE_COOKIE_MAX_AGE
): Promise<void> => {
  await setClientCookie(SIDEBAR_MODE_COOKIE, mode, maxAge);
};

export const getSidebarModeFromCookies = (
  cookies: CookieJar
): SidebarMode | null => {
  const value = cookies.get(SIDEBAR_MODE_COOKIE)?.value;
  return isSidebarMode(value) ? value : null;
};
