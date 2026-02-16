import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { organizationIdSchema } from "@/schemas/auth/organization";
import type { OrganizationAuth } from "@/types/lib/auth/organization";
import { getServerSession } from "./session";

export async function withOrganizationAuth(
  request: NextRequest,
  organizationId: string
): Promise<OrganizationAuth> {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      ),
    };
  }

  const safeOrganizationId = organizationIdSchema.parse(organizationId);
  if (!safeOrganizationId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 503 }
      ),
    };
  }

  const { user } = await getServerSession({
    headers: request.headers,
  });

  if (!user) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

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
    return {
      success: false,
      response: NextResponse.json(
        { error: "You do not have access to this organization" },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    context: {
      user,
      organizationId,
      membership,
    },
  };
}
