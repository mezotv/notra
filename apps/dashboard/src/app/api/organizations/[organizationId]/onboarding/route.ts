import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  contentTriggers,
  githubIntegrations,
  organizations,
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

    const [org, brand, integration, schedule] = await Promise.all([
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
    ]);

    const hasBrandIdentity = !!brand;
    const hasIntegration = !!integration;
    const hasSchedule = !!schedule;
    const onboardingCompleted = org?.onboardingCompleted ?? false;
    const onboardingDismissed = org?.onboardingDismissed ?? false;

    if (
      hasBrandIdentity &&
      hasIntegration &&
      hasSchedule &&
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
      onboardingCompleted:
        hasBrandIdentity && hasIntegration && hasSchedule
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
