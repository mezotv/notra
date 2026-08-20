"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2Icon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { GeoOnboardingOverlay } from "@/components/geo/geo-onboarding-overlay";
import { GeoSettingsDialog } from "@/components/geo/geo-settings-dialog";
import { PageContainer } from "@/components/layout/container";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { GEO_DEFAULT_TAB, GEO_TAB_VALUES } from "@/constants/geo";
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
  useModelUsage,
} from "@/lib/hooks/use-geo";
import type { GeoPageClientProps, GeoPageContentProps } from "@/types/geo";
import { GeoTabs } from "./components/geo-tabs";
import { GeoPageSkeleton } from "./skeleton";

const MODULES_REVEAL_MS = 150;

export default function PageClient({ organizationSlug }: GeoPageClientProps) {
  const [projectParam] = useQueryState("project", parseAsString);

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

  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: settingsData, isPending: isSettingsPending } =
    useGeoSettings(organizationId);
  const { data: overview } = useGeoOverview(organizationId);
  const { data: timeseries } = useGeoTimeseries(organizationId);
  const { data: prompts } = useGeoPrompts(organizationId);
  const { data: promptResults } = useGeoPromptResults(organizationId);
  const { data: competitorShare } = useGeoCompetitorShare(organizationId);
  const { data: competitorList } = useGeoCompetitors(organizationId);
  const { data: languageShare } = useGeoLanguageShare(organizationId);
  const { data: modelUsage } = useModelUsage(organizationId);
  const { data: trafficJourneys } = useGeoTrafficJourneys(organizationId);
  const startScan = useGeoStartScan(organizationId);
  const isScanning = useIsGeoScanning(organizationId);

  useHotkey("R", () => startScan.mutate(), { enabled: !isScanning });

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

  if (isSettingsPending) {
    return <GeoPageSkeleton />;
  }

  const settings = settingsData?.settings ?? null;

  if (!settings) {
    return (
      <PageContainer className="flex h-full min-h-0 flex-1 flex-col overflow-hidden py-4 md:py-6">
        <div className="flex min-h-0 w-full flex-1 flex-col gap-4 px-4 lg:px-6">
          <GeoOnboardingOverlay
            onManualSetup={() => setSettingsOpen(true)}
            organizationId={organizationId}
          />
          <GeoSettingsDialog
            onOpenChange={setSettingsOpen}
            open={settingsOpen}
            organizationId={organizationId}
            settings={null}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-4 px-4 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">GEO</h1>
            <p className="text-muted-foreground text-sm">
              How AI engines talk about {settings.companyName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSettingsOpen(true)}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon icon={Settings01Icon} size={16} />
              Settings
            </Button>
            <Button
              className="w-fit gap-2"
              disabled={isScanning}
              onClick={() => startScan.mutate()}
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
          competitors={competitorList?.competitors ?? []}
          engines={overview?.engines ?? []}
          isScanning={isScanning}
          journeys={trafficJourneys?.journeys ?? []}
          languagePoints={languageShare?.points ?? []}
          modelUsage={modelUsage}
          onActiveTabChange={setActiveTab}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          promptCount={prompts?.prompts.length ?? 0}
          promptResults={promptResults?.results ?? []}
          revealActive={revealActive}
          settings={settings}
          timeseriesPoints={timeseries?.points ?? []}
        />

        <GeoSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
          organizationId={organizationId}
          settings={settings}
        />
      </div>
    </PageContainer>
  );
}
