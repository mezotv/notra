import { createGitHubAppIntegrationsForInstallation } from "@notra/ai/integrations/github";
import { redis } from "@notra/ai/utils/redis";
import { ORPCError } from "@orpc/server";
import { type NextRequest, NextResponse } from "next/server";
import { GITHUB_APP_INSTALL_STATE_KEY_PREFIX } from "@/constants/github";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { getServerSession } from "@/lib/auth/session";
import type { GitHubAppInstallState } from "@/types/integrations/github-app";
import { buildCallbackUrl } from "@/utils/build-callback-url";

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const { searchParams } = new URL(request.url);
    const installationId = searchParams.get("installation_id");
    const state = searchParams.get("state");

    if (!installationId || !state || !redis) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
    }

    const raw = await redis.get<string>(
      `${GITHUB_APP_INSTALL_STATE_KEY_PREFIX}${state}`
    );
    if (!raw) {
      return NextResponse.redirect(`${baseUrl}/?error=expired_state`);
    }

    const installState: GitHubAppInstallState =
      typeof raw === "string" ? JSON.parse(raw) : raw;

    const { session } = await getServerSession({ headers: request.headers });
    if (!session?.userId || session.userId !== installState.userId) {
      return NextResponse.redirect(`${baseUrl}/?error=session_mismatch`);
    }

    try {
      await assertOrganizationAccess({
        headers: request.headers,
        organizationId: installState.organizationId,
      });
    } catch (error) {
      if (error instanceof ORPCError) {
        return NextResponse.redirect(`${baseUrl}/?error=forbidden`);
      }
      throw error;
    }

    await redis.del(`${GITHUB_APP_INSTALL_STATE_KEY_PREFIX}${state}`);

    const integrations = await createGitHubAppIntegrationsForInstallation({
      organizationId: installState.organizationId,
      userId: installState.userId,
      installationId,
    });

    return NextResponse.redirect(
      buildCallbackUrl(baseUrl, installState.callbackPath, {
        githubAppConnected: "true",
        githubAppRepositoryCount: String(integrations.length),
      })
    );
  } catch (error) {
    console.error("Error in GitHub App install callback:", error);
    return NextResponse.redirect(
      `${baseUrl}/?error=github_app_callback_failed`
    );
  }
}
