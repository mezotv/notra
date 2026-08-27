import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";

import { getServerSession } from "@/lib/auth/session";
import { badRequest, unauthorized } from "@/lib/orpc/utils/errors";

export async function assertAuthenticated({ headers }: { headers: Headers }) {
  const { session, user } = await getServerSession({ headers });
  if (!(session && user)) {
    throw unauthorized();
  }

  return { session, user };
}

export async function assertOrganizationAccess({
  headers,
  organizationId,
}: {
  headers: Headers;
  organizationId: string;
}) {
  if (!organizationId.trim()) {
    throw badRequest("Invalid organization ID");
  }

  const { user } = await assertAuthenticated({ headers });
  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, user.id),
      eq(members.organizationId, organizationId)
    ),
    columns: {
      id: true,
      role: true,
    },
  });

  if (!membership) {
    throw new ORPCError("FORBIDDEN", {
      message: "You do not have access to this organization",
    });
  }

  return {
    user,
    organizationId,
    membership,
  };
}
