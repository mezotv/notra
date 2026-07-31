import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import type { LinkedTwitterAccount } from "../types/social";

export function isTwitterPublishConfigured(): boolean {
  return Boolean(
    process.env.POST_FOR_ME_API_KEY_TWITTER || process.env.POST_FOR_ME_API_KEY
  );
}

export async function getLinkedTwitterAccount(
  organizationId: string
): Promise<LinkedTwitterAccount | null> {
  const account = await db.query.connectedSocialAccounts.findFirst({
    columns: {
      id: true,
      providerAccountId: true,
      username: true,
      displayName: true,
    },
    where: and(
      eq(connectedSocialAccounts.organizationId, organizationId),
      eq(connectedSocialAccounts.provider, "twitter")
    ),
  });

  return account ?? null;
}
