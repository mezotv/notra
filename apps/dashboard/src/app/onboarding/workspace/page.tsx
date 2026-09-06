import { db } from "@notra/db/drizzle";
import {
  brandSettings,
  organizationNotificationSettings,
  organizations,
} from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";
import { redirectIfAnyOrganizationHasPaidHistory } from "@/lib/onboarding/billing-gate";

import { WorkspaceForm } from "./workspace-form";

export default async function OnboardingWorkspacePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  await redirectIfAnyOrganizationHasPaidHistory();

  const existing = await getLastActiveOrganization();
  if (existing) {
    const brand = await db.query.brandSettings.findFirst({
      where: eq(brandSettings.organizationId, existing.id),
      columns: { id: true },
    });
    if (brand) {
      redirect("/onboarding/pricing");
    }

    const [existingOrgRow, notificationSettings] = await Promise.all([
      db.query.organizations.findFirst({
        where: eq(organizations.id, existing.id),
        columns: {
          heardAboutNotraOther: true,
          heardAboutNotraSource: true,
          id: true,
          logo: true,
          slug: true,
          name: true,
        },
      }),
      db.query.organizationNotificationSettings.findFirst({
        where: eq(organizationNotificationSettings.organizationId, existing.id),
        columns: {
          dailySummary: true,
          marketingEmails: true,
        },
      }),
    ]);

    if (existingOrgRow) {
      return (
        <WorkspaceForm
          existingOrg={{
            ...existingOrgRow,
            dailySummary: notificationSettings?.dailySummary ?? true,
            marketingEmails: notificationSettings?.marketingEmails ?? true,
          }}
        />
      );
    }
  }

  return <WorkspaceForm />;
}
