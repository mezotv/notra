import { redirect } from "next/navigation";

import { getAllUserOrganizations } from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";

export async function redirectIfAnyOrganizationHasPaidHistory() {
  const allOrgs = await getAllUserOrganizations();
  for (const org of allOrgs) {
    if (await hasPaidSubscriptionHistory(org.id)) {
      redirect(`/${org.slug}`);
    }
  }
}
