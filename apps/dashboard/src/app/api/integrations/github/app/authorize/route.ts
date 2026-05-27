import {
  getGitHubAppSlug,
  isGitHubAppConfigured,
} from "@notra/ai/utils/octokit";
import { redis } from "@notra/ai/utils/redis";
import { ORPCError } from "@orpc/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";

const githubAppAuthorizeQuerySchema = z.object({
  organizationId: z.string().min(1),
  callbackPath: z.string().optional(),
});

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
      `github_app_install:${state}`,
      JSON.stringify({
        organizationId,
        userId,
        callbackPath,
      }),
      { ex: 600 }
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
