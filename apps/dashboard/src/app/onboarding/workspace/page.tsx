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
    redirect("/onboarding/socials");
  }

  return <WorkspaceForm />;
}
