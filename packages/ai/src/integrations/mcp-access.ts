import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";

export async function hasMcpOrganizationAccess(
  organizationId: string,
  userId: string
) {
  const member = await db.query.members.findFirst({
    columns: { id: true },
    where: and(
      eq(members.organizationId, organizationId),
      eq(members.userId, userId)
    ),
  });

  return Boolean(member);
}
