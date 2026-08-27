"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import Link from "next/link";
import type { ReactNode } from "react";

import { EngineRateTable } from "@/components/geo/engine-rate-table";
import { JourneysCard } from "@/components/geo/journeys-card";
import { LanguagePerformanceCard } from "@/components/geo/language-performance-card";
import { MentionTrendCard } from "@/components/geo/mention-trend-card";
import { PromptFunnelCard } from "@/components/geo/prompt-funnel-card";
import { PromptResultsPreview } from "@/components/geo/prompt-results-preview";
import { ShareOfVoiceCard } from "@/components/geo/share-of-voice-card";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { InstrumentReveal } from "@/components/instrument/instrument-reveal";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import {
  GEO_EMPTY_COMPETITOR_SHARE_TIMESERIES,
  GEO_PROMPTS_TAB_PREVIEW_LIMIT,
} from "@/constants/geo";
import { useGeoRange } from "@/lib/hooks/use-geo-range";
import type { GeoTabsProps } from "@/types/geo";
import { withGeoProject } from "@/utils/geo-paths";
import { toGeoTab } from "@/utils/geo-tabs";

const TAB_LINK_CLASS =
  "text-muted-foreground text-xs capitalize underline-offset-4 hover:text-foreground hover:underline";

function TriggerCount({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return (
    <span className="text-muted-foreground">({count.toLocaleString()})</span>
  );
}

function TabSection({
  active,
  order,
  children,
}: {
  active: boolean;
  order: number;
  children: ReactNode;
}) {
  return (
    <InstrumentReveal active={active} className="h-full" order={order}>
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
    <Tabs
      onValueChange={(value) => onActiveTabChange(toGeoTab(value))}
      value={activeTab}
    >
      <TabsList variant="line">
        <TabsTrigger value="visibility">Visibility</TabsTrigger>
        <TabsTrigger value="prompts">
          Prompts
          <TriggerCount count={promptCount} />
        </TabsTrigger>
        <TabsTrigger value="journeys">
          Journeys
          <TriggerCount count={journeys.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent className="mt-6 flex flex-col gap-6" value="visibility">
        <TabSection active={revealActive} order={0}>
          <MentionTrendCard isScanning={isScanning} points={timeseriesPoints} />
        </TabSection>
        <TabSection active={revealActive} order={1}>
          <EngineRateTable
            engines={engines}
            isScanning={isScanning}
            promptResults={promptResults}
            timeseriesPoints={timeseriesPoints}
          />
        </TabSection>
        <InstrumentGrid className="grid-cols-1 gap-4 lg:grid-cols-2">
          <TabSection active={revealActive} order={2}>
            <ShareOfVoiceCard
              action={
                <Link
                  className={TAB_LINK_CLASS}
                  href={withGeoProject(
                    `/${organizationSlug}/geo/competitors`,
                    projectId
                  )}
                  prefetch={true}
                >
                  All competitors
                </Link>
              }
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
          <TabSection active={revealActive} order={3}>
            <LanguagePerformanceCard
              isScanning={isScanning}
              organizationId={organizationId}
              points={languagePoints}
              settings={settings}
            />
          </TabSection>
        </InstrumentGrid>
      </TabsContent>

      <TabsContent className="mt-6 flex flex-col gap-6" value="prompts">
        <InstrumentGrid className="auto-rows-fr grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <TabSection active={revealActive} order={0}>
            <PromptFunnelCard
              isScanning={isScanning}
              promptCount={promptCount}
              results={promptResults}
            />
          </TabSection>
          <TabSection active={revealActive} order={1}>
            <PromptResultsPreview
              action={
                <Link
                  className={TAB_LINK_CLASS}
                  href={promptsHref}
                  prefetch={true}
                >
                  All prompts
                </Link>
              }
              isScanning={isScanning}
              limit={GEO_PROMPTS_TAB_PREVIEW_LIMIT}
              results={promptResults}
            />
          </TabSection>
        </InstrumentGrid>
      </TabsContent>

      <TabsContent className="mt-6 flex flex-col gap-6" value="journeys">
        <TabSection active={revealActive} order={0}>
          <JourneysCard journeys={journeys} organizationId={organizationId} />
        </TabSection>
      </TabsContent>
    </Tabs>
  );
}
