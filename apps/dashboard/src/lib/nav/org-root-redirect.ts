import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSidebarModeFromCookies } from "@/utils/cookies";
import { resolveOrgRootRedirect } from "@/utils/nav";

type OrgRootSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export async function redirectOrgRootToStoredMode(
  slug: string,
  searchParams: OrgRootSearchParams
): Promise<void> {
  const [cookieStore, query] = await Promise.all([cookies(), searchParams]);
  const projectId =
    typeof query.project === "string" ? query.project : undefined;
  const storedMode = getSidebarModeFromCookies(cookieStore);
  const path = resolveOrgRootRedirect(slug, storedMode, projectId);
  if (path) {
    redirect(path);
  }
}
