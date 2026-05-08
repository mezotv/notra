import { redirect } from "next/navigation";
import { createLoader, createSerializer } from "nuqs/server";
import {
  getAllUserOrganizations,
  getLastActiveOrganization,
  getSession,
} from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";
import {
  marketingAttributionServerSearchParams,
  marketingAttributionServerUrlKeys,
} from "@/utils/marketing-attribution.server";

const loadMarketingAttribution = createLoader(
  marketingAttributionServerSearchParams,
  {
    urlKeys: marketingAttributionServerUrlKeys,
  }
);

const serializeMarketingAttribution = createSerializer(
  marketingAttributionServerSearchParams,
  {
    urlKeys: marketingAttributionServerUrlKeys,
  }
);

export default async function AuthCallback(props: {
  searchParams: Promise<{
    returnTo?: string;
    db_source?: string;
    db_landing_page_h1_variant?: string;
    db_landing_page_h1_copy?: string;
    signup_method?: string;
  }>;
}) {
  const session = await getSession();
  const searchParams = await props.searchParams;
  const marketingAttribution = await loadMarketingAttribution(searchParams);
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

  const organization = await getLastActiveOrganization();

  if (!organization) {
    redirect("/onboarding");
  }

  const hasSubHistory = await hasPaidSubscriptionHistory(organization.id);

  if (hasSubHistory) {
    redirect(`/${organization.slug}`);
  }

  const allOrgs = await getAllUserOrganizations();
  for (const org of allOrgs) {
    if (
      org.id !== organization.id &&
      (await hasPaidSubscriptionHistory(org.id))
    ) {
      redirect(`/${org.slug}`);
    }
  }

  const onboardingUrl = serializeMarketingAttribution(
    "/onboarding",
    marketingAttribution
  );
  redirect(onboardingUrl);
}
