import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";
import { encryptToken } from "@/lib/crypto/token-encryption";
import { redis } from "@/lib/redis";

interface TwitterTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type: string;
}

interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

interface OAuthState {
  organizationId: string;
  codeVerifier: string;
  callbackPath: string;
}

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state || !redis) {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
    }

    const raw = await redis.get<string>(`twitter_oauth:${state}`);
    if (!raw) {
      return NextResponse.redirect(`${baseUrl}/?error=expired_state`);
    }

    await redis.del(`twitter_oauth:${state}`);

    const oauthState: OAuthState =
      typeof raw === "string" ? JSON.parse(raw) : raw;

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/?error=twitter_not_configured`);
    }

    const redirectUri = `${baseUrl}/api/social-accounts/twitter/callback`;

    const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: oauthState.codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      const tokenError = await tokenRes.text();
      console.error("Twitter token exchange failed:", tokenError);
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }

    const tokens: TwitterTokenResponse = await tokenRes.json();

    const userRes = await fetch(
      "https://api.x.com/2/users/me?user.fields=profile_image_url",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    if (!userRes.ok) {
      console.error("Twitter user fetch failed:", await userRes.text());
      return NextResponse.redirect(`${baseUrl}/?error=user_fetch_failed`);
    }

    const userInfo: TwitterUserResponse = await userRes.json();
    const twitterUser = userInfo.data;

    const existing = await db.query.connectedSocialAccounts.findFirst({
      where: and(
        eq(connectedSocialAccounts.organizationId, oauthState.organizationId),
        eq(connectedSocialAccounts.provider, "twitter"),
        eq(connectedSocialAccounts.providerAccountId, twitterUser.id)
      ),
      columns: { id: true },
    });

    const profileImageUrl = twitterUser.profile_image_url
      ? normalizeTwitterProfileImageUrl(twitterUser.profile_image_url)
      : null;

    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null;

    if (existing) {
      await db
        .update(connectedSocialAccounts)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          scope: tokens.scope ?? null,
          tokenExpiresAt: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null,
          username: twitterUser.username,
          displayName: twitterUser.name,
          profileImageUrl,
        })
        .where(eq(connectedSocialAccounts.id, existing.id));
    } else {
      await db.insert(connectedSocialAccounts).values({
        id: crypto.randomUUID(),
        organizationId: oauthState.organizationId,
        provider: "twitter",
        providerAccountId: twitterUser.id,
        username: twitterUser.username,
        displayName: twitterUser.name,
        profileImageUrl,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        scope: tokens.scope ?? null,
        tokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      });
    }

    const rawPath = oauthState.callbackPath || "/";
    const callbackPath =
      rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath : "/";
    const separator = callbackPath.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      `${baseUrl}${callbackPath}${separator}twitterConnected=true`
    );
  } catch (error) {
    console.error("Error in Twitter OAuth callback:", error);
    return NextResponse.redirect(`${baseUrl}/?error=callback_failed`);
  }
}
