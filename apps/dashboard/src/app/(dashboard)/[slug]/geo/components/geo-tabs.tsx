"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import Link from "next/link";
import type { ReactNode } from "react";
import { AiTrafficCard } from "@/components/geo/ai-traffic-card";
import { AiTrafficLogCard } from "@/components/geo/ai-traffic-log-card";
import { EngineRateTable } from "@/components/geo/engine-rate-table";
import { JourneysCard } from "@/components/geo/journeys-card";
import { LanguagePerformanceCard } from "@/components/geo/language-performance-card";
import { MentionTrendCard } from "@/components/geo/mention-trend-card";
import { ModelUsageCard } from "@/components/geo/model-usage-card";
import { PromptResultsPreview } from "@/components/geo/prompt-results-preview";
import { ShareOfVoiceDonut } from "@/components/geo/share-of-voice-donut";
import { TrafficPagesCard } from "@/components/geo/traffic-pages-card";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { InstrumentReveal } from "@/components/instrument/instrument-reveal";
import { GEO_PROMPTS_TAB_LIMIT } from "@/constants/geo";
import type { GeoTabsProps } from "@/types/geo";
import { toGeoTab } from "@/utils/geo-tabs";

const TAB_LINK_CLASS =
  "text-muted-foreground text-xs capitalize underline-offset-4 hover:text-foreground hover:underline";

function TriggerCount({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return <span className="text-muted-foreground">({count})</span>;
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
    <InstrumentReveal active={active} order={order}>
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
  competitors,
  languagePoints,
  promptResults,
  promptCount,
  modelUsage,
  traffic,
  ingestSetup,
  trafficPages,
  journeys,
  organizationId,
}: GeoTabsProps) {
  const totals = traffic?.totals ?? { crawler: 0, aiReferral: 0, human: 0 };
  const trafficCount = totals.crawler + totals.aiReferral;

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
        <TabsTrigger value="traffic">
          Traffic
          <TriggerCount count={trafficCount} />
        </TabsTrigger>
        <TabsTrigger value="journeys">
          Journeys
          <TriggerCount count={journeys.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent className="mt-6 flex flex-col gap-6" value="visibility">
        <TabSection active={revealActive} order={0}>
          <MentionTrendCard hero points={timeseriesPoints} />
        </TabSection>
        <TabSection active={revealActive} order={1}>
          <EngineRateTable engines={engines} />
        </TabSection>
        <InstrumentGrid className="grid-cols-1 gap-4 lg:grid-cols-2">
          <TabSection active={revealActive} order={2}>
            <ShareOfVoiceDonut
              action={
                <Link
                  className={TAB_LINK_CLASS}
                  href={`/${organizationSlug}/geo/competitors`}
                >
                  All competitors
                </Link>
              }
              competitors={competitors}
              points={competitorPoints}
            />
          </TabSection>
          <TabSection active={revealActive} order={3}>
            <LanguagePerformanceCard
              configuredLanguages={settings.languages}
              points={languagePoints}
            />
          </TabSection>
        </InstrumentGrid>
        <TabSection active={revealActive} order={4}>
          <ModelUsageCard usage={modelUsage} />
        </TabSection>
      </TabsContent>

      <TabsContent className="mt-6 flex flex-col gap-6" value="prompts">
        <TabSection active={revealActive} order={0}>
          <PromptResultsPreview
            action={
              <Link
                className={TAB_LINK_CLASS}
                href={`/${organizationSlug}/geo/prompts`}
              >
                All prompts
              </Link>
            }
            languages={settings.languages}
            limit={GEO_PROMPTS_TAB_LIMIT}
            results={promptResults}
          />
        </TabSection>
      </TabsContent>

      <TabsContent className="mt-6 flex flex-col gap-6" value="traffic">
        <TabSection active={revealActive} order={0}>
          <AiTrafficCard setup={ingestSetup} traffic={traffic} />
        </TabSection>
        <TabSection active={revealActive} order={1}>
          <TrafficPagesCard pages={trafficPages} />
        </TabSection>
        <TabSection active={revealActive} order={2}>
          <AiTrafficLogCard organizationId={organizationId} />
        </TabSection>
      </TabsContent>

      <TabsContent className="mt-6 flex flex-col gap-6" value="journeys">
        <TabSection active={revealActive} order={0}>
          <JourneysCard journeys={journeys} organizationId={organizationId} />
        </TabSection>
      </TabsContent>
    </Tabs>
  );
}
