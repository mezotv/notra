import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  GITHUB_STATE_COOKIE,
  GITHUB_STATE_MAX_AGE_SECONDS,
} from "@/lib/star-video/github-cookies";
import {
  buildGithubAuthorizeUrl,
  createOAuthState,
  getGithubOAuthConfig,
} from "@/lib/star-video/github-oauth";
import { githubReturnRepoSchema } from "@/schemas/star-video";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const parsedRepo = githubReturnRepoSchema.safeParse(
    request.nextUrl.searchParams.get("repo") ?? ""
  );
  const repo = parsedRepo.success ? parsedRepo.data : null;

  const returnUrl = new URL("/repo-star-video", request.nextUrl.origin);
  if (repo) {
    returnUrl.searchParams.set("repo", repo);
  }

  const config = getGithubOAuthConfig();
  if (!config) {
    return NextResponse.redirect(returnUrl);
  }

  const state = createOAuthState();
  const redirectUri = new URL(
    "/api/star-video/github/callback",
    request.nextUrl.origin
  ).toString();

  const response = NextResponse.redirect(
    buildGithubAuthorizeUrl(config.clientId, redirectUri, state)
  );
  response.cookies.set(
    GITHUB_STATE_COOKIE,
    JSON.stringify({ state, repo: repo ?? undefined }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: GITHUB_STATE_MAX_AGE_SECONDS,
    }
  );
  return response;
}
