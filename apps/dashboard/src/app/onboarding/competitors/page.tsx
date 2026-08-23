import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLastActiveOrganization, getSession } from "@/lib/auth/actions";
import { hasPaidSubscriptionHistory } from "@/lib/billing/subscription";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";
import { getGeoOnboardingStage } from "@/lib/geo/onboarding-status";
import type { OnboardingGeoPageProps } from "@/types/onboarding";
import { geoDashboardPath, geoOnboardingPath } from "@/utils/geo-paths";
import { CompetitorsForm } from "./competitors-form";

export const metadata: Metadata = {
  title: "Pick your competitors",
};

export default async function OnboardingCompetitorsPage({
  searchParams,
}: OnboardingGeoPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const organization = await getLastActiveOrganization();
  if (!organization) {
    redirect("/onboarding/workspace");
  }

  const brand = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, organization.id),
    columns: { websiteUrl: true, companyName: true },
  });
  if (!brand) {
    redirect("/onboarding/workspace");
  }

  const { project } = await searchParams;
  const projectId =
    typeof project === "string" && project ? project : undefined;

  const [stage, hasPaidHistory] = await Promise.all([
    getGeoOnboardingStage(organization.id, projectId),
    hasPaidSubscriptionHistory(organization.id),
  ]);
  const inOnboardingFlow = !hasPaidHistory;
  const nextHref = inOnboardingFlow
    ? "/onboarding/pricing"
    : geoDashboardPath(organization.slug, projectId);

  if (stage === "brand") {
    redirect(geoOnboardingPath(projectId));
  }
  if (stage === "complete") {
    redirect(nextHref);
  }

  return (
    <CompetitorsForm
      companyName={brand.companyName ?? ""}
      domain={normalizeCompetitorDomain(brand.websiteUrl)}
      inOnboardingFlow={inOnboardingFlow}
      nextHref={nextHref}
      organizationId={organization.id}
      projectId={projectId}
    />
  );
}
