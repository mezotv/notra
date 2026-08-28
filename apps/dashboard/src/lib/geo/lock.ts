import { sql } from "drizzle-orm";

import type { DbTransaction } from "@/types/db";

export async function lockGeoProject(
  tx: DbTransaction,
  projectId: string
): Promise<void> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${`geo-project:${projectId}`}, 0))`
  );
}
