"use client";

import {
  GEO_EMPTY_COMPETITOR_SHARE_TIMESERIES,
  GEO_GAPS_NAV_LINK,
} from "@notra/geo-core/constants/geo";
import {
  PermissionOption,
  PermissionRow,
} from "@notra/ui/components/ui/permission-selector";
import Link from "next/link";
import type { ReactNode } from "react";

import { EngineRateTable } from "@/components/geo/engine-rate-table";
import { GeoPromptsPanel } from "@/components/geo/geo-prompts-panel";
import { JourneyOverviewCard } from "@/components/geo/journey-overview-card";
import { JourneyPathsCard } from "@/components/geo/journey-paths-card";
import { JourneysCard } from "@/components/geo/journeys-card";
import { LanguagePerformanceCard } from "@/components/geo/language-performance-card";
import { MentionRateCard } from "@/components/geo/mention-rate-card";
import { MentionTrendCard } from "@/components/geo/mention-trend-card";
import { ShareOfVoiceCard } from "@/components/geo/share-of-voice-card";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { InstrumentReveal } from "@/components/instrument/instrument-reveal";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import { useGeoRange } from "@/lib/hooks/use-geo-range";
import { cn } from "@/lib/utils";
import type { GeoTabsProps } from "@/types/geo";
import { geoNavHref, withGeoProject } from "@/utils/geo-paths";
import { toGeoTab } from "@/utils/geo-tabs";

const TAB_LINK_CLASS =
  "text-muted-foreground text-xs capitalize underline-offset-4 hover:text-foreground hover:underline";

function TriggerCount({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return (
    <span className="text-xs tabular-nums opacity-70">
      {count.toLocaleString()}
    </span>
  );
}

function TabSection({
  active,
  order,
  children,
  className,
}: {
  active: boolean;
  order: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <InstrumentReveal
      active={active}
      className={cn("h-full", className)}
      order={order}
    >
      {children}
    </InstrumentReveal>
  );
}

export function GeoTabs({
  activeTab,
  onActiveTabChange,
  organizationSlug,
  revealActive,
  settings,
  engines,
  timeseriesPoints,
  competitorPoints,
  competitorShareTimeseries = GEO_EMPTY_COMPETITOR_SHARE_TIMESERIES,
  competitors,
  languagePoints,
  promptResults,
  promptCount,
  isScanning,
  journeys,
  organizationId,
}: GeoTabsProps) {
  const { projectId } = useGeoProjectScope();
  const { param } = useGeoRange();
  const promptsPath = param
    ? `/${organizationSlug}/geo/prompts?range=${param}`
    : `/${organizationSlug}/geo/prompts`;
  const promptsHref = withGeoProject(promptsPath, projectId);

  return (
    <div className="flex flex-col">
      <PermissionRow
        className="w-fit shrink-0"
        label="GEO sections"
        layout="compact"
        onValueChange={(value) => onActiveTabChange(toGeoTab(value))}
        value={activeTab}
      >
        <PermissionOption value="visibility">Visibility</PermissionOption>
        <PermissionOption value="prompts">
          Prompts
          <TriggerCount count={promptCount} />
        </PermissionOption>
        <PermissionOption value="journeys">
          Journeys
          <TriggerCount count={journeys.length} />
        </PermissionOption>
      </PermissionRow>

      {activeTab === "visibility" ? (
        <div className="mt-6 flex flex-col gap-6 overflow-visible">
          <InstrumentGrid className="grid-cols-1 items-stretch gap-4 overflow-visible lg:grid-cols-12">
            <TabSection
              active={revealActive}
              className="relative z-20 overflow-visible lg:col-span-5"
              order={0}
            >
              <MentionRateCard
                engines={engines}
                isScanning={isScanning}
                organizationSlug={organizationSlug}
                promptResults={promptResults}
                timeseriesPoints={timeseriesPoints}
                trackedEngines={settings.engines}
              />
            </TabSection>
            <TabSection
              active={revealActive}
              className="lg:col-span-7"
              order={1}
            >
              <MentionTrendCard
                isScanning={isScanning}
                points={timeseriesPoints}
              />
            </TabSection>
          </InstrumentGrid>
          <TabSection active={revealActive} order={2}>
            <EngineRateTable
              engines={engines}
              isScanning={isScanning}
              organizationSlug={organizationSlug}
              promptResults={promptResults}
              timeseriesPoints={timeseriesPoints}
            />
          </TabSection>
          <InstrumentGrid className="grid-cols-1 gap-4 lg:grid-cols-2">
            <TabSection active={revealActive} order={3}>
              <ShareOfVoiceCard
                aliases={settings.aliases}
                companyName={settings.companyName}
                competitors={competitors}
                isScanning={isScanning}
                organizationId={organizationId}
                organizationSlug={organizationSlug}
                points={competitorPoints}
                timeseries={competitorShareTimeseries}
              />
            </TabSection>
            <TabSection active={revealActive} order={4}>
              <LanguagePerformanceCard
                isScanning={isScanning}
                organizationId={organizationId}
                points={languagePoints}
                settings={settings}
              />
            </TabSection>
          </InstrumentGrid>
        </div>
      ) : null}

      {activeTab === "prompts" ? (
        <div className="mt-6 flex flex-col gap-6">
          <TabSection active={revealActive} order={0}>
            <GeoPromptsPanel
              action={
                <Link
                  className={TAB_LINK_CLASS}
                  href={promptsHref}
                  prefetch={true}
                >
                  All prompts
                </Link>
              }
              gapsHref={geoNavHref(
                organizationSlug,
                GEO_GAPS_NAV_LINK,
                projectId
              )}
              isScanning={isScanning}
              results={promptResults}
            />
          </TabSection>
        </div>
      ) : null}

      {activeTab === "journeys" ? (
        <div className="mt-6 flex flex-col gap-6">
          <InstrumentGrid className="grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            <TabSection
              active={revealActive}
              className="lg:col-span-5"
              order={0}
            >
              <JourneyOverviewCard journeys={journeys} />
            </TabSection>
            <TabSection
              active={revealActive}
              className="lg:col-span-7"
              order={1}
            >
              <JourneyPathsCard journeys={journeys} />
            </TabSection>
          </InstrumentGrid>
          <TabSection active={revealActive} order={2}>
            <JourneysCard journeys={journeys} organizationId={organizationId} />
          </TabSection>
        </div>
      ) : null}
    </div>
  );
}
