"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { AiTrafficCard } from "@/components/geo/ai-traffic-card";
import { AiTrafficLogCard } from "@/components/geo/ai-traffic-log-card";
import { EngineRadarCard } from "@/components/geo/engine-radar-card";
import { GeoSettingsDialog } from "@/components/geo/geo-settings-dialog";
import { GeoSummaryStats } from "@/components/geo/geo-summary-stats";
import { LanguagePerformanceCard } from "@/components/geo/language-performance-card";
import { MentionRateCard } from "@/components/geo/mention-rate-card";
import { MentionTrendCard } from "@/components/geo/mention-trend-card";
import { ModelUsageCard } from "@/components/geo/model-usage-card";
import { PromptResultsPreview } from "@/components/geo/prompt-results-preview";
import { ShareOfVoiceDonut } from "@/components/geo/share-of-voice-donut";
import { WebsiteGenerateCard } from "@/components/geo/website-generate-card";
import { InstrumentGrid } from "@/components/instrument/instrument-grid";
import { InstrumentReveal } from "@/components/instrument/instrument-reveal";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  useAiTraffic,
  useBeaconSetup,
  useGeoCompetitorShare,
  useGeoLanguageShare,
  useGeoOverview,
  useGeoPromptResults,
  useGeoPrompts,
  useGeoSettings,
  useGeoStartScan,
  useGeoTimeseries,
  useModelUsage,
} from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import { formatSyncClock } from "@/utils/instrument";
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
  const { data: languageShare } = useGeoLanguageShare(organizationId);
  const { data: modelUsage } = useModelUsage(organizationId);
  const { data: aiTraffic } = useAiTraffic(organizationId);
  const { data: beaconSetup } = useBeaconSetup(organizationId);
  const startScan = useGeoStartScan(organizationId);

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
        <div className="w-full space-y-6 px-4 lg:px-6">
          <header className="space-y-1">
            <p className="font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
              AI engine visibility instrument
            </p>
            <h1 className="font-semibold text-xl tracking-tight">
              How often do AI engines mention you?
            </h1>
          </header>
          <WebsiteGenerateCard organizationId={organizationId} />
          <EmptyState
            action={
              <Button onClick={() => setSettingsOpen(true)} variant="outline">
                Set up manually instead
              </Button>
            }
            description="Or tell us your company name, aliases, and competitors yourself. We'll ask the major AI engines the questions your customers ask and track whether you come up."
            title="Prefer manual setup?"
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
            <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
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

        <InstrumentGrid className="grid-cols-1 lg:grid-cols-12">
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-8"
            order={0}
          >
            <MentionTrendCard hero points={timeseries?.points ?? []} />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-4"
            order={1}
          >
            <EngineRadarCard engines={overview?.engines ?? []} />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-8"
            order={2}
          >
            <MentionRateCard engines={overview?.engines ?? []} />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-4"
            order={3}
          >
            <ShareOfVoiceDonut
              action={
                <Link
                  className="font-mono text-[0.625rem] text-muted-foreground uppercase tracking-wider underline-offset-4 hover:text-foreground hover:underline"
                  href={`/${organizationSlug}/geo/competitors`}
                >
                  All competitors
                </Link>
              }
              points={competitorShare?.points ?? []}
            />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-8"
            order={4}
          >
            <PromptResultsPreview
              action={
                <Link
                  className="font-mono text-[0.625rem] text-muted-foreground uppercase tracking-wider underline-offset-4 hover:text-foreground hover:underline"
                  href={`/${organizationSlug}/geo/prompts`}
                >
                  All prompts
                </Link>
              }
              languages={settings.languages}
              results={promptResults?.results ?? []}
            />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-4"
            order={5}
          >
            <LanguagePerformanceCard
              configuredLanguages={settings.languages}
              points={languageShare?.points ?? []}
            />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-4"
            order={6}
          >
            <ModelUsageCard usage={modelUsage} />
          </InstrumentReveal>
          <InstrumentReveal
            active={stage >= STAGE.modules}
            className="lg:col-span-8"
            order={7}
          >
            <AiTrafficCard setup={beaconSetup} traffic={aiTraffic} />
          </InstrumentReveal>
          {(aiTraffic?.log.length ?? 0) > 0 && (
            <InstrumentReveal
              active={stage >= STAGE.modules}
              className="lg:col-span-12"
              order={8}
            >
              <AiTrafficLogCard log={aiTraffic?.log ?? []} />
            </InstrumentReveal>
          )}
        </InstrumentGrid>

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
