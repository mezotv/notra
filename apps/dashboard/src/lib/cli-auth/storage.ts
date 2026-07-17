import { db } from "@notra/db/drizzle";
import { verifications } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { decryptCliApiKey, encryptCliApiKey } from "@/lib/cli-auth/encryption";
import { CLI_SESSION_TTL_MS } from "@/schemas/cli-auth";
import { hashCliPollSecret } from "@/utils/cli-auth";

const CLI_INIT_IDENTIFIER_PREFIX = "cli-session-init:";
const CLI_RESULT_IDENTIFIER_PREFIX = "cli-session-result:";

function initIdentifierFor(sessionId: string) {
  return `${CLI_INIT_IDENTIFIER_PREFIX}${sessionId}`;
}

function resultIdentifierFor(sessionId: string, pollSecretHash: string) {
  return `${CLI_RESULT_IDENTIFIER_PREFIX}${sessionId}:${pollSecretHash}`;
}

export async function initializeCliSession(
  sessionId: string,
  pollSecretHash: string
): Promise<boolean> {
  const identifier = initIdentifierFor(sessionId);
  const [created] = await db
    .insert(verifications)
    .values({
      id: identifier,
      identifier,
      value: pollSecretHash,
      expiresAt: new Date(Date.now() + CLI_SESSION_TTL_MS),
    })
    .onConflictDoNothing({ target: verifications.id })
    .returning({ id: verifications.id });

  return Boolean(created);
}

export async function getCliSessionPollSecretHash(
  sessionId: string
): Promise<string | null> {
  const identifier = initIdentifierFor(sessionId);
  const [row] = await db
    .select({ value: verifications.value, expiresAt: verifications.expiresAt })
    .from(verifications)
    .where(eq(verifications.id, identifier))
    .limit(1);

  if (!row) {
    return null;
  }

  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(verifications).where(eq(verifications.id, identifier));
    return null;
  }

  return row.value;
}

export async function storeCliSessionKey(
  sessionId: string,
  apiKey: string
): Promise<boolean> {
  const initIdentifier = initIdentifierFor(sessionId);
  const encryptedApiKey = encryptCliApiKey(apiKey);
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select({
        value: verifications.value,
        expiresAt: verifications.expiresAt,
      })
      .from(verifications)
      .where(eq(verifications.id, initIdentifier))
      .limit(1)
      .for("update");

    if (!session || session.expiresAt.getTime() < Date.now()) {
      if (session) {
        await tx
          .delete(verifications)
          .where(eq(verifications.id, initIdentifier));
      }
      return false;
    }

    const identifier = resultIdentifierFor(sessionId, session.value);
    const expiresAt = new Date(Date.now() + CLI_SESSION_TTL_MS);
    const [created] = await tx
      .insert(verifications)
      .values({
        id: identifier,
        identifier,
        value: encryptedApiKey,
        expiresAt,
      })
      .onConflictDoNothing({ target: verifications.id })
      .returning({
        id: verifications.id,
      });

    if (created) {
      await tx
        .update(verifications)
        .set({ expiresAt })
        .where(eq(verifications.id, initIdentifier));
    }

    return Boolean(created);
  });
}

export async function consumeCliSessionKey(
  sessionId: string,
  pollSecret: string
): Promise<
  | { status: "pending" }
  | { status: "ready"; apiKey: string }
  | { status: "expired" }
> {
  const pollSecretHash = hashCliPollSecret(pollSecret);
  const identifier = resultIdentifierFor(sessionId, pollSecretHash);
  const initIdentifier = initIdentifierFor(sessionId);

  return db.transaction(async (tx) => {
    const [session] = await tx
      .select({
        value: verifications.value,
        expiresAt: verifications.expiresAt,
      })
      .from(verifications)
      .where(eq(verifications.id, initIdentifier))
      .limit(1)
      .for("update");

    if (!session) {
      return { status: "expired" } as const;
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await tx.delete(verifications).where(eq(verifications.id, identifier));
      await tx
        .delete(verifications)
        .where(eq(verifications.id, initIdentifier));
      return { status: "expired" } as const;
    }

    const [row] = await tx
      .select({
        value: verifications.value,
        expiresAt: verifications.expiresAt,
      })
      .from(verifications)
      .where(eq(verifications.id, identifier))
      .limit(1)
      .for("update");

    if (!row) {
      return { status: "pending" } as const;
    }

    if (row.expiresAt.getTime() < Date.now()) {
      await tx.delete(verifications).where(eq(verifications.id, identifier));
      await tx
        .delete(verifications)
        .where(eq(verifications.id, initIdentifier));
      return { status: "expired" } as const;
    }

    const apiKey = decryptCliApiKey(row.value);
    await tx.delete(verifications).where(eq(verifications.id, identifier));
    await tx.delete(verifications).where(eq(verifications.id, initIdentifier));
    return { status: "ready", apiKey } as const;
  });
}
