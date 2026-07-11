import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";

export async function hasOrganizationAccess(
  userId: string,
  organizationId: string
) {
  const member = await db.query.members.findFirst({
    columns: { id: true },
    where: and(
      eq(members.userId, userId),
      eq(members.organizationId, organizationId)
    ),
  });
  return Boolean(member);
}
