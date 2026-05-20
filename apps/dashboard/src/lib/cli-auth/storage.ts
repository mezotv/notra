import { db } from "@notra/db/drizzle";
import { verifications } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { CLI_SESSION_TTL_MS } from "@/schemas/cli-auth";

const CLI_IDENTIFIER_PREFIX = "cli-session:";

function identifierFor(sessionId: string) {
  return `${CLI_IDENTIFIER_PREFIX}${sessionId}`;
}

export async function storeCliSessionKey(sessionId: string, apiKey: string) {
  const identifier = identifierFor(sessionId);
  await db
    .delete(verifications)
    .where(eq(verifications.identifier, identifier));
  await db.insert(verifications).values({
    id: crypto.randomUUID(),
    identifier,
    value: apiKey,
    expiresAt: new Date(Date.now() + CLI_SESSION_TTL_MS),
  });
}

export async function consumeCliSessionKey(
  sessionId: string
): Promise<
  | { status: "pending" }
  | { status: "ready"; apiKey: string }
  | { status: "expired" }
> {
  const identifier = identifierFor(sessionId);
  const [row] = await db
    .delete(verifications)
    .where(eq(verifications.identifier, identifier))
    .returning();

  if (!row) {
    return { status: "pending" };
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return { status: "expired" };
  }
  return { status: "ready", apiKey: row.value };
}
