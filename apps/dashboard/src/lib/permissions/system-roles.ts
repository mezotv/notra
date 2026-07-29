import { SYSTEM_ROLE_DEFINITIONS } from "@notra/db/constants/permissions";
import { db } from "@notra/db/drizzle";
import { organizationRoles } from "@notra/db/schema";
import { nanoid } from "nanoid";
import { retryTransientDbError } from "@/lib/db/retry";

export async function ensureSystemRoles(organizationId: string) {
  await retryTransientDbError(() =>
    db
      .insert(organizationRoles)
      .values(
        SYSTEM_ROLE_DEFINITIONS.map((definition) => ({
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
