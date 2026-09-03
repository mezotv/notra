"use client";

import { AgentReadinessScanningNotice } from "@/components/geo/agent-readiness/readiness-scanning-notice";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useGeoSettings } from "@/lib/hooks/use-geo";
import { useGeoActiveProject } from "@/lib/hooks/use-geo-active-project";
import type { GeoProjectSetupGateProps } from "@/types/geo";

export function GeoProjectSetupGate({ children }: GeoProjectSetupGateProps) {
  const { activeOrganization } = useOrganizationsContext();
  const { project, domain } = useGeoActiveProject(activeOrganization?.id ?? "");
  const { data: settingsData } = useGeoSettings(activeOrganization?.id ?? "");

  if (!project || settingsData?.settings !== null) {
    return children;
  }

  return (
    <PageContainer className="flex flex-1 flex-col py-4 md:py-6">
      <div className="w-full px-4 lg:px-6">
        <AgentReadinessScanningNotice targetUrl={domain ?? "your website"} />
      </div>
    </PageContainer>
  );
}
