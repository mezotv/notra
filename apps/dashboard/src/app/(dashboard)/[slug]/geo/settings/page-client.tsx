"use client";

import { GeoSettingsForm } from "@/components/geo/geo-settings-form";
import { PageContainer } from "@/components/layout/container";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useGeoModelCatalog, useGeoSettings } from "@/lib/hooks/use-geo";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import type { GeoPageClientProps } from "@/types/geo";
import { GeoSettingsSkeleton } from "./skeleton";

export default function PageClient({ organizationSlug }: GeoPageClientProps) {
  const [projectParam] = useGeoProjectQueryState();

  return (
    <GeoProjectProvider projectId={projectParam ?? undefined}>
      <SettingsPageContent organizationSlug={organizationSlug} />
    </GeoProjectProvider>
  );
}

function SettingsPageContent({ organizationSlug }: GeoPageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: settingsData, isPending } = useGeoSettings(organizationId);
  const { data: catalog } = useGeoModelCatalog(organizationId);

  if (isPending || !catalog) {
    return <GeoSettingsSkeleton />;
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full px-4 lg:px-6">
        <GeoSettingsForm
          catalog={catalog}
          organizationId={organizationId}
          settings={settingsData?.settings ?? null}
        />
      </div>
    </PageContainer>
  );
}
