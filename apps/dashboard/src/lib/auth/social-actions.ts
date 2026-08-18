"use server";

import { getWorkOS } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SOCIAL_AUTH_CALLBACK_PATH,
  SOCIAL_AUTH_PROVIDERS,
  SOCIAL_AUTH_STATE_COOKIE,
  SOCIAL_AUTH_STATE_MAX_AGE_SECONDS,
} from "@/constants/social-auth";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import type { StartSocialSignInInput } from "@/types/auth/social-actions";

export async function startSocialSignInAction(input: StartSocialSignInInput) {
  const mappedProvider = SOCIAL_AUTH_PROVIDERS[input.provider];

  if (!mappedProvider) {
    redirect("/login");
  }

  const returnTo = sanitizeReturnTo(input.returnTo ?? null);
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
