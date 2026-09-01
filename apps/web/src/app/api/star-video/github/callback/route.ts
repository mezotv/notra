import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  GITHUB_CONNECTED_COOKIE,
  GITHUB_COOKIE_MAX_AGE_SECONDS,
  GITHUB_COOKIE_PATH,
  GITHUB_STATE_COOKIE,
  GITHUB_TOKEN_COOKIE,
  GITHUB_TOKEN_COOKIE_PATH,
} from "@/lib/star-video/github-cookies";
import {
  encryptGithubToken,
  exchangeGithubCode,
  fetchGithubLogin,
  getGithubCallbackUrl,
  getGithubOAuthConfig,
  readPendingOAuthStates,
} from "@/lib/star-video/github-oauth";
import { githubCallbackQuerySchema } from "@/schemas/star-video";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = githubCallbackQuerySchema.safeParse({
    code: request.nextUrl.searchParams.get("code") ?? "",
    state: request.nextUrl.searchParams.get("state") ?? "",
  });
  const pendingStates = readPendingOAuthStates(
    request.cookies.get(GITHUB_STATE_COOKIE)?.value
  );
  const stateData = query.success
    ? pendingStates.find((entry) => entry.state === query.data.state)
    : undefined;

  const returnUrl = new URL("/repo-star-video", request.nextUrl.origin);
  if (stateData?.repo) {
    returnUrl.searchParams.set("repo", stateData.repo);
  }

  const response = NextResponse.redirect(returnUrl);
  response.cookies.delete({
    name: GITHUB_STATE_COOKIE,
    path: GITHUB_COOKIE_PATH,
  });

  const config = getGithubOAuthConfig();
  if (!(config && stateData && query.success)) {
    return response;
  }

  const redirectUri = getGithubCallbackUrl(request);
  const token = await exchangeGithubCode(query.data.code, redirectUri, config);
  if (!token) {
    return response;
  }
  const login = await fetchGithubLogin(token);
  if (!login) {
    return response;
  }

  const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GITHUB_COOKIE_MAX_AGE_SECONDS,
  } as const;

  response.cookies.set(
    GITHUB_TOKEN_COOKIE,
    encryptGithubToken(token, config.clientSecret),
    { ...cookieOptions, httpOnly: true, path: GITHUB_TOKEN_COOKIE_PATH }
  );
  response.cookies.set(GITHUB_CONNECTED_COOKIE, login, {
    ...cookieOptions,
    path: GITHUB_COOKIE_PATH,
  });
  return response;
}
