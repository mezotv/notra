import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  getAllUserOrganizations,
  getLastActiveOrganization,
  getSession,
} from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const allOrgs = await getAllUserOrganizations();
  for (const org of allOrgs) {
    if (await hasPaidSubscriptionHistory(org.id)) {
      redirect(`/${org.slug}`);
    }
  }

  const organization = await getLastActiveOrganization();

  if (!organization) {
    redirect("/onboarding/workspace");
  }

  const brand = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, organization.id),
    columns: { id: true },
  });

  if (!brand) {
    redirect("/onboarding/workspace");
  }

  redirect("/onboarding/socials");
}
