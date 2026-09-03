import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { desc, eq } from "drizzle-orm";

import { retryTransientDbError } from "@/lib/db/retry";
import { badRequest } from "@/lib/orpc/utils/errors";
import type {
  GeoShelfMember,
  GeoShelfOpportunityWrite,
} from "@/types/geo-shelf";

export async function listGeoShelfMembers(
  organizationId: string
): Promise<GeoShelfMember[]> {
  const rows = await retryTransientDbError(() =>
    db.query.members.findMany({
      where: eq(members.organizationId, organizationId),
      orderBy: [desc(members.createdAt)],
      with: {
        users: {
          columns: { id: true, name: true, email: true, image: true },
        },
      },
    })
  );

  return rows.flatMap((row) => {
    if (!row.users) {
      return [];
    }
    return [
      {
        id: row.id,
        userId: row.users.id,
        name: row.users.name,
        email: row.users.email,
        image: row.users.image,
        role: row.role,
      },
    ];
  });
}

export function findCurrentGeoShelfMemberId(
  shelfMembers: GeoShelfMember[],
  userId: string
): string | null {
  return shelfMembers.find((member) => member.userId === userId)?.id ?? null;
}

export function assertGeoShelfOpportunityMembers(
  shelfMembers: GeoShelfMember[],
  opportunity: GeoShelfOpportunityWrite | null | undefined
): void {
  if (!opportunity) {
    return;
  }
  const memberIds = new Set(shelfMembers.map((member) => member.id));
  const referenced = [opportunity.assigneeMemberId, opportunity.pocMemberId];
  for (const memberId of referenced) {
    if (memberId && !memberIds.has(memberId)) {
      throw badRequest("That person is not a member of this organization");
    }
  }
}
