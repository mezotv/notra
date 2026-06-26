import { db } from "@notra/db/drizzle";
import { verifications } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import {
  OAUTH_AUTH_CODE_TTL_MS,
  OAUTH_CLIENT_TTL_MS,
  OAUTH_REFRESH_TOKEN_TTL_MS,
} from "@/constants/oauth";
import { createOpaqueOAuthToken, hashOAuthToken } from "@/lib/oauth/crypto";
import {
  oauthAuthorizationCodePayloadSchema,
  oauthRefreshTokenPayloadSchema,
  oauthRegisteredClientPayloadSchema,
} from "@/schemas/oauth";
import type {
  OAuthAuthorizationCodePayload,
  OAuthRefreshTokenPayload,
  OAuthRegisteredClient,
} from "@/types/oauth";

const CODE_IDENTIFIER_PREFIX = "oauth-code:";
const CLIENT_IDENTIFIER_PREFIX = "oauth-client:";
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

  if (!row) {
    return null;
  }

  if (row.expiresAt.getTime() < Date.now()) {
    await db
      .delete(verifications)
      .where(eq(verifications.identifier, row.identifier));
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

export async function registerOAuthClient(input: {
  redirectUris: string[];
  clientName?: string;
}) {
  const clientId = createOpaqueOAuthToken();
  const client: OAuthRegisteredClient = {
    clientId,
    redirectUris: input.redirectUris,
    createdAt: new Date().toISOString(),
  };
  if (input.clientName) {
    client.clientName = input.clientName;
  }

  await storeVerification(
    `${CLIENT_IDENTIFIER_PREFIX}${clientId}`,
    client,
    new Date(Date.now() + OAUTH_CLIENT_TTL_MS)
  );

  return client;
}

async function getOAuthClient(clientId: string) {
  const row = await db.query.verifications.findFirst({
    where: eq(
      verifications.identifier,
      `${CLIENT_IDENTIFIER_PREFIX}${clientId}`
    ),
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return null;
  }

  return parseVerificationValue(row.value, oauthRegisteredClientPayloadSchema);
}

export async function isRegisteredOAuthRedirect(
  clientId: string,
  redirectUri: string
) {
  const client = await getOAuthClient(clientId);
  return client?.redirectUris.includes(redirectUri) ?? false;
}

export async function rotateOAuthRefreshToken(
  refreshToken: string,
  expectedClientId?: string
) {
  const refreshTokenHash = await hashOAuthToken(refreshToken);
  const row = await db.query.verifications.findFirst({
    where: eq(
      verifications.identifier,
      `${REFRESH_IDENTIFIER_PREFIX}${refreshTokenHash}`
    ),
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) {
      await db
        .delete(verifications)
        .where(eq(verifications.identifier, row.identifier));
    }
    return null;
  }

  const payload = parseVerificationValue(
    row.value,
    oauthRefreshTokenPayloadSchema
  );
  if (!payload || (expectedClientId && expectedClientId !== payload.clientId)) {
    return null;
  }

  const [deletedRow] = await db
    .delete(verifications)
    .where(
      eq(
        verifications.identifier,
        `${REFRESH_IDENTIFIER_PREFIX}${refreshTokenHash}`
      )
    )
    .returning();

  if (!deletedRow) {
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
