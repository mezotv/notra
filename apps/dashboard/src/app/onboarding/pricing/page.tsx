import { redirect } from "next/navigation";
import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";
import { redirectIfAnyOrganizationHasPaidHistory } from "@/lib/onboarding/billing-gate";
import { PricingClient } from "../pricing-client";

export default async function OnboardingPricingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  await redirectIfAnyOrganizationHasPaidHistory();

  const organization = await getLastActiveOrganization();
  if (!organization) {
    redirect("/onboarding/workspace");
  }

  return <PricingClient slug={organization.slug} />;
}
