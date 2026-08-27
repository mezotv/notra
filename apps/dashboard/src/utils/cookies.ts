import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import {
  LAST_VISITED_ORGANIZATION_COOKIE,
  SIDEBAR_MODE_COOKIE,
  SIDEBAR_MODE_COOKIE_MAX_AGE,
} from "@/constants/cookies";
import type { SidebarMode } from "@/types/components/nav";
import { isSidebarMode } from "@/utils/nav";

type CookieJar = RequestCookies | ReadonlyRequestCookies;

async function setClientCookie(
  name: string,
  value: string,
  maxAge: number
): Promise<void> {
  const isSecure =
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" ||
      process.env.NODE_ENV === "production");

  if (typeof window !== "undefined" && "cookieStore" in window) {
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
    // biome-ignore lint/suspicious/noDocumentCookie: Fallback for browsers without Cookie Store API support
    document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax${secureFlag}`;
  }
}

export const setLastVisitedOrganization = async (
  organizationSlug: string,
  maxAge: number = 30 * 86_400
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
