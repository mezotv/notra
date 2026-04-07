import { redirect } from "next/navigation";
import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";

export default async function AuthCallback(props: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const session = await getSession();
  const searchParams = await props.searchParams;
  let returnTo = searchParams.returnTo;

  if (!session?.user) {
    redirect("/login");
  }

  if (returnTo && typeof returnTo === "string") {
    try {
      returnTo = decodeURIComponent(returnTo);
    } catch {
      // If decoding fails, use original value
    }
    if (
      returnTo.startsWith("/") &&
      !returnTo.startsWith("//") &&
      !returnTo.includes("\\")
    ) {
      redirect(returnTo);
      return;
    }
  }

  const organization = await getLastActiveOrganization(session.user.id);

  if (!organization) {
    redirect("/onboarding");
  }

  const hasSubHistory = await hasPaidSubscriptionHistory(organization.id);

  if (hasSubHistory) {
    redirect(`/${organization.slug}`);
  }

  redirect("/onboarding");
}
