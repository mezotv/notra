import type { createDb } from "@notra/db/drizzle-http";
import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";

type DbClient = ReturnType<typeof createDb>;

export async function getOrganizationResponse(
  db: DbClient,
  organizationId: string
) {
  return db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: {
      id: true,
      slug: true,
      name: true,
      logo: true,
    },
  });
}
