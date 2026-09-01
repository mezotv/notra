import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { eq, sql } from "drizzle-orm";

export async function countBrandVoices(
  organizationId: string
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, organizationId));

  return rows[0]?.count ?? 0;
}
