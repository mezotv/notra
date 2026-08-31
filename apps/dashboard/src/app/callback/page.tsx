import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { redirect } from "next/navigation";
import { createLoader, createSerializer } from "nuqs/server";

import { CALLBACK_DESTINATIONS } from "@/constants/analytics-events";
import {
  setPersonProperties,
  trackServerEvent,
} from "@/lib/analytics/posthog-server";
import { readRequestHeaders } from "@/lib/analytics/request-headers";
import {
  getAllUserOrganizations,
  getLastActiveOrganization,
  getSession,
} from "@/lib/auth/actions";
import { isSessionBanned } from "@/lib/auth/banned";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";
import type { CallbackDestination } from "@/types/analytics/events";
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
  const [session, searchParams, requestHeaders] = await Promise.all([
    getSession(),
    props.searchParams,
    readRequestHeaders(),
  ]);
  const marketingAttribution = await loadMarketingAttribution(searchParams);
  const userId = session?.user?.id ?? null;
  let returnTo = searchParams.returnTo;

  const trackRouted = (destination: CallbackDestination) => {
    trackServerEvent({
      event: POSTHOG_EVENTS.CALLBACK_ROUTED,
      headers: requestHeaders,
      userId,
      properties: { destination },
    });
  };

  if (!session?.user) {
    if (await isSessionBanned()) {
      trackRouted(CALLBACK_DESTINATIONS.BANNED);
      redirect("/auth/banned");
    }
    trackRouted(CALLBACK_DESTINATIONS.LOGIN);
    redirect("/login");
  }

  if (
    marketingAttribution.dbSource ||
    marketingAttribution.dbLandingPageH1Variant ||
    marketingAttribution.signupMethod
  ) {
    setPersonProperties({
      userId: session.user.id,
      setOnce: {
        db_source: marketingAttribution.dbSource ?? undefined,
        landing_page_h1_variant:
          marketingAttribution.dbLandingPageH1Variant ?? undefined,
        signup_method_param: marketingAttribution.signupMethod ?? undefined,
      },
    });
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
      trackRouted(CALLBACK_DESTINATIONS.RETURN_TO);
      redirect(returnTo);
      return;
    }
  }

  const organization = await getLastActiveOrganization();

  if (!organization) {
    trackRouted(CALLBACK_DESTINATIONS.ONBOARDING);
    redirect("/onboarding");
  }

  const hasSubHistory = await hasPaidSubscriptionHistory(organization.id);

  if (hasSubHistory) {
    trackRouted(CALLBACK_DESTINATIONS.DASHBOARD);
    redirect(`/${organization.slug}`);
  }

  const allOrgs = await getAllUserOrganizations();
  for (const org of allOrgs) {
    if (
      org.id !== organization.id &&
      (await hasPaidSubscriptionHistory(org.id))
    ) {
      trackRouted(CALLBACK_DESTINATIONS.DASHBOARD);
      redirect(`/${org.slug}`);
    }
  }

  const onboardingUrl = serializeMarketingAttribution(
    "/onboarding",
    marketingAttribution
  );
  trackRouted(CALLBACK_DESTINATIONS.ONBOARDING);
  redirect(onboardingUrl);
}
