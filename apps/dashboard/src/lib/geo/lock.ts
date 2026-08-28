import { sql } from "drizzle-orm";
import type { Effect } from "effect";

import { geoDb } from "@/lib/geo/effect";
import type { GeoDatabaseError } from "@/lib/geo/errors";
import type { DbTransaction } from "@/types/db";

export function lockGeoProject(
  tx: DbTransaction,
  projectId: string
): Effect.Effect<void, GeoDatabaseError> {
  return geoDb("project lock failed", async () => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`geo-project:${projectId}`}, 0))`
    );
  });
}
