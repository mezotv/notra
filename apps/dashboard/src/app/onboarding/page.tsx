import { redirect } from "next/navigation";
import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";
import { PricingClient } from "./pricing-client";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const organization = await getLastActiveOrganization(session.user.id);

  if (!organization) {
    redirect("/login");
  }

  const hasSubHistory = await hasPaidSubscriptionHistory(organization.id);

  if (hasSubHistory) {
    redirect(`/${organization.slug}`);
  }

  return <PricingClient slug={organization.slug} />;
}
