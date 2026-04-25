import { db } from "@notra/db/drizzle";
import { brandSettings, organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  getAllUserOrganizations,
  getLastActiveOrganization,
  getSession,
} from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";
import { WorkspaceForm } from "./workspace-form";

export default async function OnboardingWorkspacePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const allOrgs = await getAllUserOrganizations(session.user.id);
  for (const org of allOrgs) {
    if (await hasPaidSubscriptionHistory(org.id)) {
      redirect(`/${org.slug}`);
    }
  }

  const existing = await getLastActiveOrganization(session.user.id);
  if (existing) {
    const brand = await db.query.brandSettings.findFirst({
      where: eq(brandSettings.organizationId, existing.id),
      columns: { id: true },
    });
    if (brand) {
      redirect("/onboarding/socials");
    }

    const existingOrgRow = await db.query.organizations.findFirst({
      where: eq(organizations.id, existing.id),
      columns: { id: true, slug: true, name: true },
    });

    if (existingOrgRow) {
      return <WorkspaceForm existingOrg={existingOrgRow} />;
    }
  }

  return <WorkspaceForm />;
}
