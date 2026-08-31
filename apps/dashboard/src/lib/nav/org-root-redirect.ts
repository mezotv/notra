import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { DEFAULT_SIDEBAR_ENTRY_MODE } from "@/constants/studio-analytics";
import { trackServerEvent } from "@/lib/analytics/posthog-server";
import { getSidebarModeFromCookies } from "@/utils/cookies";
import { resolveOrgRootRedirect } from "@/utils/nav";

type OrgRootSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export async function redirectOrgRootToStoredMode(
  slug: string,
  searchParams: OrgRootSearchParams
): Promise<void> {
  const [cookieStore, requestHeaders, query] = await Promise.all([
    cookies(),
    headers(),
    searchParams,
  ]);
  const projectId =
    typeof query.project === "string" ? query.project : undefined;
  const storedMode = getSidebarModeFromCookies(cookieStore);
  trackServerEvent({
    event: POSTHOG_EVENTS.DASHBOARD_ENTRY,
    headers: requestHeaders,
    properties: {
      mode: storedMode ?? DEFAULT_SIDEBAR_ENTRY_MODE,
      has_project: Boolean(projectId),
    },
  });
  const path = resolveOrgRootRedirect(slug, storedMode, projectId);
  if (path) {
    redirect(path);
  }
}
