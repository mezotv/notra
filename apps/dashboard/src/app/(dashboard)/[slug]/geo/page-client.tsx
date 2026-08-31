"use client";

import { GEO_DEFAULT_TAB, GEO_TAB_VALUES } from "@notra/geo-core/constants/geo";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2Icon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/button";
import { GeoRangePicker } from "@/components/geo/geo-range-picker";
import { GeoSetupEmpty } from "@/components/geo/geo-setup-empty";
import { PageContainer } from "@/components/layout/container";
import {
  GeoProjectProvider,
  useGeoProjectScope,
} from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { trackEvent } from "@/lib/analytics/posthog-client";
import {
  useGeoCompetitorShare,
  useGeoCompetitors,
  useGeoLanguageShare,
  useGeoOverview,
  useGeoPromptResults,
  useGeoPrompts,
  useGeoSettings,
  useGeoStartScan,
  useGeoTimeseries,
  useGeoTrafficJourneys,
  useIsGeoScanning,
} from "@/lib/hooks/use-geo";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { useGeoRange } from "@/lib/hooks/use-geo-range";
import type { GeoPageClientProps, GeoPageContentProps } from "@/types/geo";
import { geoNavHref } from "@/utils/geo-paths";

import { GeoTabs } from "./components/geo-tabs";
import { GeoPageSkeleton } from "./skeleton";

const MODULES_REVEAL_MS = 150;

export default function PageClient({ organizationSlug }: GeoPageClientProps) {
  const [projectParam] = useGeoProjectQueryState();

  return (
    <GeoProjectProvider projectId={projectParam ?? undefined}>
      <GeoPageContent organizationSlug={organizationSlug} />
    </GeoProjectProvider>
  );
}

function GeoPageContent({ organizationSlug }: GeoPageContentProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";
  const { projectId } = useGeoProjectScope();
  const geoRange = useGeoRange();

  const { data: settingsData, isPending: isSettingsPending } =
    useGeoSettings(organizationId);
  const { data: overview } = useGeoOverview(organizationId, geoRange.query);
  const { data: timeseries } = useGeoTimeseries(organizationId, geoRange.query);
  const { data: prompts } = useGeoPrompts(organizationId);
  const { data: promptResults } = useGeoPromptResults(
    organizationId,
    geoRange.query
  );
  const { data: competitorShare } = useGeoCompetitorShare(
    organizationId,
    geoRange.query
  );
  const { data: competitorList } = useGeoCompetitors(organizationId);
  const { data: languageShare } = useGeoLanguageShare(
    organizationId,
    geoRange.query
  );
  const { data: trafficJourneys } = useGeoTrafficJourneys(
    organizationId,
    geoRange.query
  );
  const startScan = useGeoStartScan(organizationId);
  const isScanning = useIsGeoScanning(organizationId);

  useHotkey("R", () => startScan.mutate("hotkey"), { enabled: !isScanning });

  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(GEO_TAB_VALUES).withDefault(GEO_DEFAULT_TAB)
  );

  const reduceMotion = useReducedMotion();
  const [modulesVisible, setModulesVisible] = useState(false);
  const ready = !isSettingsPending;
  const revealActive = ready && (Boolean(reduceMotion) || modulesVisible);

  useEffect(() => {
    if (!(ready && !reduceMotion)) {
      return;
    }
    const timer = setTimeout(() => setModulesVisible(true), MODULES_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [ready, reduceMotion]);

  const overviewViewedRef = useRef(false);
  const hasSettings = Boolean(settingsData?.settings);
  const overviewLoaded = overview !== undefined;
  const engineCount = overview?.engines.length ?? 0;
  const rangePreset = geoRange.preset;

  useEffect(() => {
    if (
      overviewViewedRef.current ||
      !ready ||
      (hasSettings && !overviewLoaded)
    ) {
      return;
    }
    overviewViewedRef.current = true;
    trackEvent(POSTHOG_EVENTS.GEO_OVERVIEW_VIEWED, {
      has_data: engineCount > 0,
      has_settings: hasSettings,
      range: rangePreset,
      tab: activeTab,
    });
  }, [activeTab, engineCount, hasSettings, overviewLoaded, rangePreset, ready]);

  if (isSettingsPending) {
    return <GeoPageSkeleton />;
  }

  const settings = settingsData?.settings ?? null;

  if (!settings) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full px-4 lg:px-6">
          <GeoSetupEmpty
            page="overview"
            settingsHref={geoNavHref(
              organizationSlug,
              "/geo/settings",
              projectId
            )}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">GEO</h1>
            <p className="text-muted-foreground">
              How AI engines talk about {settings.companyName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GeoRangePicker control={geoRange} />
            <Button
              className="w-fit gap-2"
              disabled={isScanning}
              onClick={() => startScan.mutate("manual")}
              size="sm"
            >
              <span className="inline-flex items-center gap-1.5">
                {isScanning && <Loader2Icon className="size-4 animate-spin" />}
                Run Scan
              </span>
              <Kbd className="hidden sm:inline-flex">R</Kbd>
            </Button>
          </div>
        </header>

        <GeoTabs
          activeTab={activeTab}
          competitorPoints={competitorShare?.points ?? []}
          competitorShareTimeseries={competitorShare?.timeseries ?? []}
          competitors={competitorList?.competitors ?? []}
          engines={overview?.engines ?? []}
          isScanning={isScanning}
          journeys={trafficJourneys?.journeys ?? []}
          languagePoints={languageShare?.points ?? []}
          onActiveTabChange={setActiveTab}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          promptCount={prompts?.prompts.length ?? 0}
          promptResults={promptResults?.results ?? []}
          revealActive={revealActive}
          settings={settings}
          timeseriesPoints={timeseries?.points ?? []}
        />
      </div>
    </PageContainer>
  );
}
