import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import type { LinkedTwitterAccount } from "../types/social";

export function isTwitterPublishConfigured(): boolean {
  return Boolean(
    process.env.POST_FOR_ME_API_KEY_TWITTER || process.env.POST_FOR_ME_API_KEY
  );
}

export async function getLinkedTwitterAccounts(
  organizationId: string
): Promise<LinkedTwitterAccount[]> {
  return db.query.connectedSocialAccounts.findMany({
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
    orderBy: asc(connectedSocialAccounts.createdAt),
  });
}
