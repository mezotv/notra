"use client";

import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { AiTrafficCard } from "@/components/geo/ai-traffic-card";
import { AiTrafficLogCard } from "@/components/geo/ai-traffic-log-card";
import { TrafficEmpty } from "@/components/geo/traffic-empty";
import { TrafficPagesCard } from "@/components/geo/traffic-pages-card";
import { InstrumentReveal } from "@/components/instrument/instrument-reveal";
import { PageContainer } from "@/components/layout/container";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import { GEO_TRAFFIC_REVEAL_MS } from "@/constants/geo";
import {
  useAiTraffic,
  useGeoIngestSetup,
  useGeoSettings,
  useGeoTrafficPages,
} from "@/lib/hooks/use-geo";
import type { GeoPageClientProps } from "@/types/geo";
import { GeoPageSkeleton } from "../skeleton";

export default function PageClient({ organizationSlug }: GeoPageClientProps) {
  const [projectParam] = useQueryState("project", parseAsString);

  return (
    <GeoProjectProvider projectId={projectParam ?? undefined}>
      <TrafficPageContent organizationSlug={organizationSlug} />
    </GeoProjectProvider>
  );
}

function TrafficPageContent({ organizationSlug }: GeoPageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: settingsData, isPending } = useGeoSettings(organizationId);
  const { data: traffic } = useAiTraffic(organizationId);
  const { data: ingestSetup } = useGeoIngestSetup(organizationId);
  const { data: trafficPages } = useGeoTrafficPages(organizationId);

  const reduceMotion = useReducedMotion();
  const [modulesVisible, setModulesVisible] = useState(false);
  const ready = !isPending;
  const revealActive = ready && (Boolean(reduceMotion) || modulesVisible);

  useEffect(() => {
    if (!(ready && !reduceMotion)) {
      return;
    }
    const timer = setTimeout(
      () => setModulesVisible(true),
      GEO_TRAFFIC_REVEAL_MS
    );
    return () => clearTimeout(timer);
  }, [ready, reduceMotion]);

  if (isPending) {
    return <GeoPageSkeleton />;
  }

  if (!settingsData?.settings) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <header className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">AI Traffic</h1>
            <p className="text-muted-foreground">
              AI crawlers and referrals visiting your site
            </p>
          </header>
          <EmptyState
            action={
              <Button
                nativeButton={false}
                render={<Link href={`/${organizationSlug}/geo`} />}
              >
                Set up GEO tracking
              </Button>
            }
            description="Set up GEO tracking first, then watch AI crawlers and referrals as they arrive."
            preview={
              <EmptyStateTablePreview
                columns={EMPTY_STATE_TABLE_COLUMNS.traffic}
                rows={EMPTY_STATE_TABLE_ROWS}
              />
            }
            title="Not set up yet"
          />
        </div>
      </PageContainer>
    );
  }

  const header = (
    <header className="space-y-1">
      <h1 className="font-bold text-3xl tracking-tight">AI Traffic</h1>
      <p className="text-muted-foreground">
        AI crawlers and referrals visiting your site
      </p>
    </header>
  );

  if ((traffic?.sources.length ?? 0) === 0) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex w-full flex-col gap-6 px-4 lg:px-6">
          {header}
          <InstrumentReveal active={revealActive} order={0}>
            <TrafficEmpty setup={ingestSetup} />
          </InstrumentReveal>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        {header}
        <div className="flex flex-col gap-6">
          <InstrumentReveal active={revealActive} order={0}>
            <AiTrafficCard traffic={traffic} />
          </InstrumentReveal>
          <InstrumentReveal active={revealActive} order={1}>
            <TrafficPagesCard pages={trafficPages?.pages ?? []} />
          </InstrumentReveal>
          <InstrumentReveal active={revealActive} order={2}>
            <AiTrafficLogCard
              organizationId={organizationId}
              organizationSlug={organizationSlug}
            />
          </InstrumentReveal>
        </div>
      </div>
    </PageContainer>
  );
}
