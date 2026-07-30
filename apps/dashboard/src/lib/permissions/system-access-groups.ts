import { SYSTEM_ACCESS_GROUPS } from "@notra/db/constants/permissions";
import { db } from "@notra/db/drizzle";
import { accessGroups } from "@notra/db/schema";
import { nanoid } from "nanoid";
import { retryTransientDbError } from "@/lib/db/retry";

export async function ensureSystemAccessGroups(organizationId: string) {
  await retryTransientDbError(() =>
    db
      .insert(accessGroups)
      .values(
        SYSTEM_ACCESS_GROUPS.map((definition) => ({
          id: nanoid(),
          organizationId,
          name: definition.name,
          description: definition.description,
          scopes: [...definition.scopes],
          systemKey: definition.key,
        }))
      )
      .onConflictDoNothing()
  );
}
