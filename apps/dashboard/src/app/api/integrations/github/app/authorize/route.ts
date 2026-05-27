import {
  getGitHubAppSlug,
  isGitHubAppConfigured,
} from "@notra/ai/utils/github-app";
import { redis } from "@notra/ai/utils/redis";
import { ORPCError } from "@orpc/server";
import { type NextRequest, NextResponse } from "next/server";
import {
  GITHUB_APP_INSTALL_STATE_KEY_PREFIX,
  GITHUB_APP_INSTALL_STATE_TTL_SECONDS,
} from "@/constants/github";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { githubAppAuthorizeQuerySchema } from "@/schemas/integrations";

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const { searchParams } = new URL(request.url);
    const parsed = githubAppAuthorizeQuerySchema.safeParse({
      organizationId: searchParams.get("organizationId") ?? undefined,
      callbackPath: searchParams.get("callbackPath") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_request`);
    }

    const { organizationId, callbackPath } = parsed.data;

    let userId: string;
    try {
      const access = await assertOrganizationAccess({
        headers: request.headers,
        organizationId,
      });
      userId = access.user.id;
    } catch (error) {
      if (error instanceof ORPCError) {
        return NextResponse.redirect(`${baseUrl}/?error=forbidden`);
      }
      throw error;
    }

    const appSlug = getGitHubAppSlug();
    if (!(appSlug && redis && isGitHubAppConfigured())) {
      return NextResponse.redirect(
        `${baseUrl}/?error=github_app_not_configured`
      );
    }

    const state = crypto.randomUUID();

    await redis.set(
      `${GITHUB_APP_INSTALL_STATE_KEY_PREFIX}${state}`,
      JSON.stringify({
        organizationId,
        userId,
        callbackPath,
      }),
      { ex: GITHUB_APP_INSTALL_STATE_TTL_SECONDS }
    );

    const installUrl = new URL(
      `https://github.com/apps/${encodeURIComponent(appSlug)}/installations/new`
    );
    installUrl.searchParams.set("state", state);

    return NextResponse.redirect(installUrl.toString());
  } catch (error) {
    console.error("Error initiating GitHub App install:", error);
    return NextResponse.redirect(`${baseUrl}/?error=github_app_auth_failed`);
  }
}
