import { getWorkOS } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  SOCIAL_AUTH_CALLBACK_PATH,
  SOCIAL_AUTH_PROVIDERS,
  SOCIAL_AUTH_STATE_COOKIE,
  SOCIAL_AUTH_STATE_MAX_AGE_SECONDS,
} from "@/constants/social-auth";
import { sanitizeReturnTo } from "@/lib/auth/return-to";

export function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  return handleSocialStart(request, context.params);
}

async function handleSocialStart(
  request: NextRequest,
  params: Promise<{ provider: string }>
) {
  const { provider } = await params;
  const mappedProvider = SOCIAL_AUTH_PROVIDERS[provider];

  if (!mappedProvider) {
    redirect("/login");
  }

  const returnTo = sanitizeReturnTo(
    request.nextUrl.searchParams.get("returnTo")
  );
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const nonce = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(SOCIAL_AUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl.startsWith("https://"),
    maxAge: SOCIAL_AUTH_STATE_MAX_AGE_SECONDS,
    path: "/",
  });

  const url = getWorkOS().userManagement.getAuthorizationUrl({
    clientId: process.env.WORKOS_CLIENT_ID ?? "",
    provider: mappedProvider,
    redirectUri: `${appUrl}${SOCIAL_AUTH_CALLBACK_PATH}`,
    state: returnTo ? `${nonce}:${returnTo}` : nonce,
  });

  redirect(url);
}
