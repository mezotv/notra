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
      settings: settings ?? {
        scheduledContentCreation: false,
        scheduledContentFailed: false,
      },
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

    const updates: Record<string, boolean | Date> = {
      updatedAt: new Date(),
    };

    if (validationResult.data.scheduledContentCreation !== undefined) {
      updates.scheduledContentCreation =
        validationResult.data.scheduledContentCreation;
    }
    if (validationResult.data.scheduledContentFailed !== undefined) {
      updates.scheduledContentFailed =
        validationResult.data.scheduledContentFailed;
    }

    const [updated] = await db
      .insert(organizationNotificationSettings)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        scheduledContentCreation:
          validationResult.data.scheduledContentCreation ?? false,
        scheduledContentFailed:
          validationResult.data.scheduledContentFailed ?? false,
      })
      .onConflictDoUpdate({
        target: organizationNotificationSettings.organizationId,
        set: updates,
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
