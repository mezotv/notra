import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";
import { redirectIfAnyOrganizationHasPaidHistory } from "@/lib/onboarding/billing-gate";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  await redirectIfAnyOrganizationHasPaidHistory();

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

  redirect("/onboarding/pricing");
}
