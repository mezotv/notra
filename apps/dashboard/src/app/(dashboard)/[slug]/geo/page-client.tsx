"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { GeoOnboardingOverlay } from "@/components/geo/geo-onboarding-overlay";
import { GeoSettingsDialog } from "@/components/geo/geo-settings-dialog";
import { GeoSummaryStats } from "@/components/geo/geo-summary-stats";
import { InstrumentReveal } from "@/components/instrument/instrument-reveal";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { GEO_DEFAULT_TAB, GEO_TAB_VALUES } from "@/constants/geo";
import {
  useAiTraffic,
  useGeoCompetitorShare,
  useGeoCompetitors,
  useGeoIngestSetup,
  useGeoLanguageShare,
  useGeoOverview,
  useGeoPromptResults,
  useGeoPrompts,
  useGeoSettings,
  useGeoStartScan,
  useGeoTimeseries,
  useGeoTrafficJourneys,
  useGeoTrafficPages,
  useModelUsage,
} from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import { formatSyncClock } from "@/utils/instrument";
import { GeoTabs } from "./components/geo-tabs";
import { GeoPageSkeleton } from "./skeleton";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — GEO instrument panel
 *
 * Read top-to-bottom. Each `at` value is ms after data mount.
 *
 *    0ms   header + scan controls render statically
 *   60ms   AI visibility master gauge powers on,
 *          sync dot starts pulsing
 *  150ms   modules materialize over the grid substrate
 *          (staggered 45ms in reading order)
 *
 * Reduced motion: everything appears at once, no offsets.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  masterGauge: 60, // AI visibility gauge powers on
  modules: 150, // grid modules start staggering in
};

const STAGE = {
  gauge: 1, // master gauge visible
  modules: 2, // grid modules visible
};

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

  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: settingsData, isPending: isSettingsPending } =
    useGeoSettings(organizationId);
  const { data: overview, dataUpdatedAt } = useGeoOverview(organizationId);
  const { data: timeseries } = useGeoTimeseries(organizationId);
  const { data: prompts } = useGeoPrompts(organizationId);
  const { data: promptResults } = useGeoPromptResults(organizationId);
  const { data: competitorShare } = useGeoCompetitorShare(organizationId);
  const { data: competitorList } = useGeoCompetitors(organizationId);
  const { data: languageShare } = useGeoLanguageShare(organizationId);
  const { data: modelUsage } = useModelUsage(organizationId);
  const { data: aiTraffic } = useAiTraffic(organizationId);
  const { data: ingestSetup } = useGeoIngestSetup(organizationId);
  const { data: trafficPages } = useGeoTrafficPages(organizationId);
  const { data: trafficJourneys } = useGeoTrafficJourneys(organizationId);
  const startScan = useGeoStartScan(organizationId);

  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(GEO_TAB_VALUES).withDefault(GEO_DEFAULT_TAB)
  );

  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const ready = !isSettingsPending;

  useEffect(() => {
    if (!ready) {
      setStage(0);
      return;
    }
    if (reduceMotion) {
      setStage(STAGE.modules);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage(STAGE.gauge), TIMING.masterGauge));
    timers.push(setTimeout(() => setStage(STAGE.modules), TIMING.modules));
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [ready, reduceMotion]);

  if (isSettingsPending) {
    return <GeoPageSkeleton />;
  }

  const settings = settingsData?.settings ?? null;

  if (!settings) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full px-4 lg:px-6">
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
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-semibold text-xl tracking-tight">GEO</h1>
            <p className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground text-sm">
              <span>
                How AI engines talk about {settings.companyName} ·{" "}
                {startScan.isPending
                  ? "Scanning"
                  : `Sync ${formatSyncClock(dataUpdatedAt || null)}`}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  startScan.isPending
                    ? "bg-muted-foreground/50"
                    : "bg-emerald-500",
                  !startScan.isPending &&
                    stage >= STAGE.gauge &&
                    "animate-pulse motion-reduce:animate-none"
                )}
              />
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
              disabled={startScan.isPending}
              onClick={() => startScan.mutate()}
              size="sm"
            >
              {startScan.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Run scan
            </Button>
          </div>
        </header>

        <InstrumentReveal active={stage >= STAGE.gauge}>
          <GeoSummaryStats
            engines={overview?.engines ?? []}
            promptCount={prompts?.prompts.length ?? 0}
            settings={settings}
          />
        </InstrumentReveal>

        <GeoTabs
          activeTab={activeTab}
          competitorPoints={competitorShare?.points ?? []}
          competitors={competitorList?.competitors ?? []}
          engines={overview?.engines ?? []}
          ingestSetup={ingestSetup}
          journeys={trafficJourneys?.journeys ?? []}
          languagePoints={languageShare?.points ?? []}
          modelUsage={modelUsage}
          onActiveTabChange={setActiveTab}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          promptCount={prompts?.prompts.length ?? 0}
          promptResults={promptResults?.results ?? []}
          revealActive={stage >= STAGE.modules}
          settings={settings}
          timeseriesPoints={timeseries?.points ?? []}
          traffic={aiTraffic}
          trafficPages={trafficPages?.pages ?? []}
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
