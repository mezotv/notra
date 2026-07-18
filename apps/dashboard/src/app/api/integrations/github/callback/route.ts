import {
  GitHubAccountRequiredError,
  GitHubInstallationAccessDeniedError,
  GitHubReauthorizationRequiredError,
  upsertGitHubAppInstallation,
} from "@notra/ai/integrations/github";
import { redis } from "@notra/ai/utils/redis";
import { buildCallbackUrl } from "@notra/utils/callback-url";
import { ORPCError } from "@orpc/server";
import { type NextRequest, NextResponse } from "next/server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { getServerSession } from "@/lib/auth/session";

interface GitHubAppInstallState {
  organizationId: string;
  userId: string;
  callbackPath: string;
}

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let callbackPath: string | null = null;
  let installationId: string | null = null;
  let state: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    installationId = searchParams.get("installation_id");
    state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/?error=${encodeURIComponent(error)}`
      );
    }

    if (!(installationId && state && redis)) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
    }

    const raw = await redis.get<string>(`github_app_install:${state}`);
    if (!raw) {
      return NextResponse.redirect(`${baseUrl}/?error=expired_state`);
    }

    const installState: GitHubAppInstallState =
      typeof raw === "string" ? JSON.parse(raw) : raw;
    callbackPath = installState.callbackPath;

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

    await upsertGitHubAppInstallation({
      organizationId: installState.organizationId,
      userId: installState.userId,
      installationId,
    });

    await redis.del(`github_app_install:${state}`);

    return NextResponse.redirect(
      buildCallbackUrl(baseUrl, installState.callbackPath, {
        githubConnected: "true",
      })
    );
  } catch (error) {
    if (
      error instanceof GitHubAccountRequiredError ||
      error instanceof GitHubReauthorizationRequiredError
    ) {
      if (callbackPath && installationId && state) {
        return NextResponse.redirect(
          buildCallbackUrl(baseUrl, callbackPath, {
            githubReauthorizeInstallationId: installationId,
            githubReauthorizeState: state,
          })
        );
      }
      return NextResponse.redirect(
        `${baseUrl}/?error=github_reauthorization_required`
      );
    }
    if (error instanceof GitHubInstallationAccessDeniedError) {
      return NextResponse.redirect(
        `${baseUrl}/?error=github_installation_forbidden`
      );
    }
    console.error("Error in GitHub App callback:", error);
    return NextResponse.redirect(`${baseUrl}/?error=github_callback_failed`);
  }
}
