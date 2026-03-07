import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { eq } from "drizzle-orm";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

interface SocialAccount {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}

async function refreshToken(account: SocialAccount): Promise<string> {
  if (!account.refreshToken) {
    throw new Error(
      "Token expired and no refresh token available. Please reconnect your X account."
    );
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Twitter OAuth is not configured");
  }

  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(
      "Failed to refresh token. Please reconnect your X account."
    );
  }

  const tokens: TokenResponse = await res.json();

  await db
    .update(connectedSocialAccounts)
    .set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? account.refreshToken,
      tokenExpiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    })
    .where(eq(connectedSocialAccounts.id, account.id));

  return tokens.access_token;
}

export async function getValidAccessToken(
  account: SocialAccount
): Promise<string> {
  const isExpired =
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() - TOKEN_EXPIRY_BUFFER_MS < Date.now();

  if (isExpired) {
    return refreshToken(account);
  }

  return account.accessToken;
}

export async function twitterFetch(
  url: string,
  account: SocialAccount,
  init?: RequestInit
): Promise<Response> {
  const token = await getValidAccessToken(account);
  const res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 && account.refreshToken) {
    const newToken = await refreshToken(account);
    return fetch(url, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${newToken}` },
    });
  }

  return res;
}
