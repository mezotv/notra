import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  GITHUB_CONNECTED_COOKIE,
  GITHUB_COOKIE_MAX_AGE_SECONDS,
  GITHUB_STATE_COOKIE,
  GITHUB_TOKEN_COOKIE,
} from "@/lib/star-video/github-cookies";
import {
  encryptGithubToken,
  exchangeGithubCode,
  getGithubOAuthConfig,
} from "@/lib/star-video/github-oauth";
import {
  githubCallbackQuerySchema,
  githubOAuthStateSchema,
} from "@/schemas/star-video";

export const runtime = "nodejs";

function parseStateCookie(value: string | undefined) {
  if (!value) {
    return null;
  }
  try {
    const parsed = githubOAuthStateSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const stateData = parseStateCookie(
    request.cookies.get(GITHUB_STATE_COOKIE)?.value
  );

  const returnUrl = new URL("/repo-star-video", request.nextUrl.origin);
  if (stateData?.repo) {
    returnUrl.searchParams.set("repo", stateData.repo);
  }

  const response = NextResponse.redirect(returnUrl);
  response.cookies.delete(GITHUB_STATE_COOKIE);

  const config = getGithubOAuthConfig();
  if (!(config && stateData)) {
    return response;
  }

  const query = githubCallbackQuerySchema.safeParse({
    code: request.nextUrl.searchParams.get("code") ?? "",
    state: request.nextUrl.searchParams.get("state") ?? "",
  });
  if (!query.success || query.data.state !== stateData.state) {
    return response;
  }

  const redirectUri = new URL(
    "/api/star-video/github/callback",
    request.nextUrl.origin
  ).toString();
  const token = await exchangeGithubCode(query.data.code, redirectUri, config);
  if (!token) {
    return response;
  }

  const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GITHUB_COOKIE_MAX_AGE_SECONDS,
  } as const;

  response.cookies.set(
    GITHUB_TOKEN_COOKIE,
    encryptGithubToken(token, config.clientSecret),
    { ...cookieOptions, httpOnly: true }
  );
  response.cookies.set(GITHUB_CONNECTED_COOKIE, "1", cookieOptions);
  return response;
}
