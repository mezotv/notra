import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { OAUTH_ACCESS_TOKEN_TTL_SECONDS } from "@/constants/oauth";
import { getOAuthIssuer } from "@/lib/oauth/metadata";
import type {
  OAuthAccessTokenPayload,
  OAuthRefreshTokenPayload,
  OAuthTokenResponse,
} from "@/types/oauth";

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getSigningSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET must be defined");
  }
  return secret;
}

export function createOpaqueOAuthToken() {
  return base64Url(randomBytes(32));
}

export function hashOAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createPkceChallenge(verifier: string) {
  return base64Url(createHash("sha256").update(verifier).digest());
}

export function verifyPkceChallenge(verifier: string, challenge: string) {
  const actual = Buffer.from(createPkceChallenge(verifier));
  const expected = Buffer.from(challenge);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signOAuthAccessToken(payload: OAuthRefreshTokenPayload): string {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: OAuthAccessTokenPayload = {
    ...payload,
    iss: getOAuthIssuer(),
    sub: payload.userId,
    aud: payload.resource,
    iat: now,
    exp: now + OAUTH_ACCESS_TOKEN_TTL_SECONDS,
    typ: "access",
  };

  const encodedHeader = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64Url(JSON.stringify(tokenPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64Url(
    createHmac("sha256", getSigningSecret()).update(signingInput).digest()
  );

  return `${signingInput}.${signature}`;
}

export function buildOAuthTokenResponse(
  payload: OAuthRefreshTokenPayload,
  refreshToken: string
): OAuthTokenResponse {
  return {
    access_token: signOAuthAccessToken(payload),
    token_type: "Bearer",
    expires_in: OAUTH_ACCESS_TOKEN_TTL_SECONDS,
    scope: payload.scope,
    refresh_token: refreshToken,
  };
}
