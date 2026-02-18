import { db } from "@notra/db/drizzle";
import { organizationNotificationSettings } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { updateNotificationSettingsSchema } from "@/schemas/notification-settings";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const settings = await db.query.organizationNotificationSettings.findFirst({
      where: eq(
        organizationNotificationSettings.organizationId,
        organizationId
      ),
    });

    return NextResponse.json({
      settings: settings ?? { scheduledContentCreation: false },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    if (auth.context.membership.role !== "owner") {
      return NextResponse.json(
        {
          error: "Only the organization owner can update notification settings",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = updateNotificationSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { scheduledContentCreation } = validationResult.data;

    const [updated] = await db
      .insert(organizationNotificationSettings)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        scheduledContentCreation,
      })
      .onConflictDoUpdate({
        target: organizationNotificationSettings.organizationId,
        set: {
          scheduledContentCreation,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ settings: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
