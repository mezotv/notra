import { db } from "@notra/db/drizzle";
import { verifications } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import {
  OAUTH_AUTH_CODE_TTL_MS,
  OAUTH_REFRESH_TOKEN_TTL_MS,
} from "@/constants/oauth";
import { createOpaqueOAuthToken, hashOAuthToken } from "@/lib/oauth/crypto";
import {
  oauthAuthorizationCodePayloadSchema,
  oauthRefreshTokenPayloadSchema,
} from "@/schemas/oauth";
import type {
  OAuthAuthorizationCodePayload,
  OAuthRefreshTokenPayload,
} from "@/types/oauth";

const CODE_IDENTIFIER_PREFIX = "oauth-code:";
const REFRESH_IDENTIFIER_PREFIX = "oauth-refresh:";

async function storeVerification(
  identifier: string,
  value: unknown,
  expiresAt: Date
) {
  await db
    .delete(verifications)
    .where(eq(verifications.identifier, identifier));
  await db.insert(verifications).values({
    id: crypto.randomUUID(),
    identifier,
    value: JSON.stringify(value),
    expiresAt,
  });
}

function parseVerificationValue<T>(
  value: string,
  schema: {
    safeParse: (
      value: unknown
    ) => { success: true; data: T } | { success: false };
  }
): T | null {
  try {
    const parsed = schema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function createOAuthAuthorizationCode(
  payload: OAuthAuthorizationCodePayload
) {
  const code = createOpaqueOAuthToken();
  const codeHash = await hashOAuthToken(code);
  await storeVerification(
    `${CODE_IDENTIFIER_PREFIX}${codeHash}`,
    payload,
    new Date(Date.now() + OAUTH_AUTH_CODE_TTL_MS)
  );
  return code;
}

export async function consumeOAuthAuthorizationCode(code: string) {
  const codeHash = await hashOAuthToken(code);
  const [row] = await db
    .delete(verifications)
    .where(eq(verifications.identifier, `${CODE_IDENTIFIER_PREFIX}${codeHash}`))
    .returning();

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return null;
  }

  return parseVerificationValue(row.value, oauthAuthorizationCodePayloadSchema);
}

export async function createOAuthRefreshToken(
  payload: OAuthRefreshTokenPayload
) {
  const refreshToken = createOpaqueOAuthToken();
  const refreshTokenHash = await hashOAuthToken(refreshToken);
  await storeVerification(
    `${REFRESH_IDENTIFIER_PREFIX}${refreshTokenHash}`,
    payload,
    new Date(Date.now() + OAUTH_REFRESH_TOKEN_TTL_MS)
  );
  return refreshToken;
}

export async function rotateOAuthRefreshToken(refreshToken: string) {
  const refreshTokenHash = await hashOAuthToken(refreshToken);
  const [row] = await db
    .delete(verifications)
    .where(
      eq(
        verifications.identifier,
        `${REFRESH_IDENTIFIER_PREFIX}${refreshTokenHash}`
      )
    )
    .returning();

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return null;
  }

  const payload = parseVerificationValue(
    row.value,
    oauthRefreshTokenPayloadSchema
  );
  if (!payload) {
    return null;
  }

  const nextRefreshToken = await createOAuthRefreshToken(payload);
  return { payload, refreshToken: nextRefreshToken };
}

export async function revokeOAuthRefreshToken(refreshToken: string) {
  const refreshTokenHash = await hashOAuthToken(refreshToken);
  await db
    .delete(verifications)
    .where(
      eq(
        verifications.identifier,
        `${REFRESH_IDENTIFIER_PREFIX}${refreshTokenHash}`
      )
    );
}
