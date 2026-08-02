"use client";

import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { GeoSettingsDialog } from "@/components/geo/geo-settings-dialog";
import { GeoSummaryStats } from "@/components/geo/geo-summary-stats";
import { MentionRateCard } from "@/components/geo/mention-rate-card";
import { ModelUsageCard } from "@/components/geo/model-usage-card";
import { WebsiteGenerateCard } from "@/components/geo/website-generate-card";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  useGeoOverview,
  useGeoPrompts,
  useGeoSettings,
  useGeoStartScan,
  useGeoTimeseries,
  useModelUsage,
} from "@/lib/hooks/use-geo";
import { GeoPageSkeleton } from "./skeleton";

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
  const { data: overview } = useGeoOverview(organizationId);
  const { data: timeseries } = useGeoTimeseries(organizationId);
  const { data: prompts } = useGeoPrompts(organizationId);
  const { data: modelUsage } = useModelUsage(organizationId);
  const startScan = useGeoStartScan(organizationId);

  if (isSettingsPending) {
    return <GeoPageSkeleton />;
  }

  const settings = settingsData?.settings ?? null;

  if (!settings) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <header className="space-y-1">
            <h1 className="font-semibold text-2xl">GEO</h1>
            <p className="text-muted-foreground text-sm">
              Track how often AI engines mention your company
            </p>
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
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-semibold text-2xl">GEO</h1>
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

        <GeoSummaryStats
          engines={overview?.engines ?? []}
          promptCount={prompts?.prompts.length ?? 0}
          settings={settings}
        />

        <MentionRateCard
          engines={overview?.engines ?? []}
          points={timeseries?.points ?? []}
        />

        <ModelUsageCard usage={modelUsage} />

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
