"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PromptManager } from "@/components/geo/prompt-manager";
import { PromptResultsCard } from "@/components/geo/prompt-results-card";
import { WebsiteGenerateCard } from "@/components/geo/website-generate-card";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useGeoPromptResults, useGeoSettings } from "@/lib/hooks/use-geo";
import { GeoPageSkeleton } from "../skeleton";

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: settingsData, isPending } = useGeoSettings(organizationId);
  const { data: promptResults } = useGeoPromptResults(organizationId);

  if (isPending) {
    return <GeoPageSkeleton />;
  }

  if (!settingsData?.settings) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <header className="space-y-1">
            <h1 className="font-semibold text-2xl">Prompts</h1>
            <p className="text-muted-foreground text-sm">
              The questions we ask AI engines on your behalf
            </p>
          </header>
          <EmptyState
            action={
              <Link
                className="text-primary text-sm underline underline-offset-4"
                href={`/${organizationSlug}/geo`}
              >
                Set up GEO tracking
              </Link>
            }
            description="Set up GEO tracking first, then manage the prompts scanned across AI engines."
            title="Not set up yet"
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="space-y-1">
          <h1 className="font-semibold text-2xl">Prompts</h1>
          <p className="text-muted-foreground text-sm">
            The questions we ask AI engines on your behalf
          </p>
        </header>
        <PromptManager organizationId={organizationId} />
        <WebsiteGenerateCard compact organizationId={organizationId} />
        <PromptResultsCard results={promptResults?.results ?? []} />
      </div>
    </PageContainer>
  );
}
