import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  contentTriggers,
  githubIntegrations,
  organizations,
  posts,
} from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";

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

    const [org, brand, integration, schedule, content] = await Promise.all([
      db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
        columns: { onboardingCompleted: true, onboardingDismissed: true },
      }),
      db.query.brandSettings.findFirst({
        where: eq(brandSettings.organizationId, organizationId),
        columns: { id: true },
      }),
      db.query.githubIntegrations.findFirst({
        where: eq(githubIntegrations.organizationId, organizationId),
        columns: { id: true },
      }),
      db.query.contentTriggers.findFirst({
        where: and(
          eq(contentTriggers.organizationId, organizationId),
          eq(contentTriggers.sourceType, "cron")
        ),
        columns: { id: true },
      }),
      db.query.posts.findFirst({
        where: eq(posts.organizationId, organizationId),
        columns: { id: true },
      }),
    ]);

    const hasBrandIdentity = !!brand;
    const hasIntegration = !!integration;
    const hasSchedule = !!schedule;
    const hasContent = !!content;
    const onboardingCompleted = org?.onboardingCompleted ?? false;
    const onboardingDismissed = org?.onboardingDismissed ?? false;

    if (
      hasBrandIdentity &&
      hasIntegration &&
      hasSchedule &&
      hasContent &&
      !onboardingCompleted
    ) {
      await db
        .update(organizations)
        .set({ onboardingCompleted: true })
        .where(eq(organizations.id, organizationId));
    }

    return NextResponse.json({
      hasBrandIdentity,
      hasIntegration,
      hasSchedule,
      hasContent,
      onboardingCompleted:
        hasBrandIdentity && hasIntegration && hasSchedule && hasContent
          ? true
          : onboardingCompleted,
      onboardingDismissed,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();

    if (body.dismissed === true) {
      await db
        .update(organizations)
        .set({ onboardingDismissed: true })
        .where(eq(organizations.id, organizationId));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}
