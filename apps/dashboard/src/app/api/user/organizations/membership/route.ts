import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { and, count, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { deleteOrganizationFiles } from "@/lib/upload/cleanup";
import { organizationMembershipActionSchema } from "@/schemas/api-params";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getServerSession({ headers: request.headers });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = organizationMembershipActionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { organizationId, action } = validationResult.data;

    let shouldCleanupDeletedOrganization = false;

    const result = await db.transaction(async (tx) => {
      await tx
        .select({ id: members.id })
        .from(members)
        .where(eq(members.userId, user.id))
        .for("update");

      const membership = await tx.query.members.findFirst({
        where: and(
          eq(members.organizationId, organizationId),
          eq(members.userId, user.id)
        ),
        columns: {
          id: true,
          role: true,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You are not a member of this organization" },
          { status: 403 }
        );
      }

      const [membershipCountResult] = await tx
        .select({ count: count() })
        .from(members)
        .where(eq(members.userId, user.id));

      const membershipCount = membershipCountResult?.count ?? 0;

      if (membershipCount <= 1) {
        return NextResponse.json(
          { error: "You must keep at least one organization" },
          { status: 400 }
        );
      }

      if (action === "delete") {
        if (membership.role !== "owner") {
          return NextResponse.json(
            { error: "Only organization owners can delete organizations" },
            { status: 403 }
          );
        }

        await tx
          .delete(organizations)
          .where(eq(organizations.id, organizationId));
        shouldCleanupDeletedOrganization = true;

        return NextResponse.json({
          success: true,
          action: "delete",
        });
      }

      if (membership.role === "owner") {
        return NextResponse.json(
          {
            error:
              "Organization owners cannot leave directly. Delete the organization instead.",
          },
          { status: 400 }
        );
      }

      await tx
        .delete(members)
        .where(
          and(
            eq(members.organizationId, organizationId),
            eq(members.userId, user.id)
          )
        );

      return NextResponse.json({
        success: true,
        action: "leave",
      });
    });

    if (shouldCleanupDeletedOrganization) {
      await deleteOrganizationFiles(organizationId).catch((error) => {
        console.error(
          `[Delete Org] Failed to cleanup R2 files for ${organizationId}:`,
          error
        );
      });
    }

    return result;
  } catch (error) {
    console.error("Error processing organization membership action:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
