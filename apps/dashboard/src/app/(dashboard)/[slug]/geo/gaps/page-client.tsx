"use client";

import { GEO_SEARCH_GAP_DISMISSED_TOAST } from "@notra/geo-core/constants/geo";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { GeoGapsTable } from "@/components/geo/gaps-table";
import { GeoWriterNeedsSetup } from "@/components/geo/writer/page-gate";
import { WriteDialog } from "@/components/geo/writer/write-dialog";
import { PageContainer } from "@/components/layout/container";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { GEO_WRITE_DIALOG_ENTRIES } from "@/constants/geo-analytics";
import {
  useGeoCompetitors,
  useGeoRescanPrompt,
  useGeoSettings,
  useGeoStartScan,
  useGeoSuggestionDismiss,
  useIsGeoScanning,
} from "@/lib/hooks/use-geo";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { useGeoWriterGaps } from "@/lib/hooks/use-geo-writer";
import type { GeoGapsPageContentProps } from "@/types/components/geo-gaps";
import type { WriteDialogInitialState } from "@/types/components/geo-writer";
import type { GeoPageClientProps } from "@/types/geo";
import {
  emptyWriteDialogState,
  geoContentPath,
  writeDialogStateFromGap,
} from "@/utils/geo-write-entry";

import { GeoGapsSkeleton } from "./skeleton";

export default function PageClient({ organizationSlug }: GeoPageClientProps) {
  const [projectParam] = useGeoProjectQueryState();

  return (
    <GeoProjectProvider projectId={projectParam ?? undefined}>
      <GeoGapsPageContent organizationSlug={organizationSlug} />
    </GeoProjectProvider>
  );
}

function GeoGapsPageContent({ organizationSlug }: GeoGapsPageContentProps) {
  const router = useRouter();
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: settingsData, isPending: isSettingsPending } =
    useGeoSettings(organizationId);
  const gapsQuery = useGeoWriterGaps(organizationId);
  const competitorsQuery = useGeoCompetitors(organizationId);
  const startScan = useGeoStartScan(organizationId);
  const rescanPrompt = useGeoRescanPrompt(organizationId);
  const isScanning = useIsGeoScanning(organizationId);
  const dismissSuggestion = useGeoSuggestionDismiss(organizationId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitial, setDialogInitial] =
    useState<WriteDialogInitialState | null>(null);

  const openDialog = useCallback((initial?: WriteDialogInitialState) => {
    setDialogInitial(initial ?? emptyWriteDialogState());
    setDialogOpen(true);
  }, []);

  if (!(isSettingsPending || settingsData?.settings)) {
    return (
      <GeoWriterNeedsSetup
        description="Questions engines answer without mentioning you"
        organizationId={organizationId}
        title="Content Gaps"
      />
    );
  }

  if (isSettingsPending && !gapsQuery.data) {
    return <GeoGapsSkeleton />;
  }

  return (
    <PageContainer
      className="flex h-full min-h-full flex-1 flex-col overflow-hidden py-4 md:py-6"
      data-geo-gaps-page=""
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6 px-4 lg:px-6">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Content Gaps</h1>
            <p className="text-muted-foreground">
              Questions engines answer without mentioning you
            </p>
          </div>
        </header>

        {gapsQuery.isPending ? (
          <GeoGapsSkeleton embedded />
        ) : (
          <GeoGapsTable
            competitors={competitorsQuery.data?.competitors ?? []}
            hasScanData={gapsQuery.data?.hasScanData ?? false}
            isScanning={isScanning}
            onOpenPost={(postId) => {
              router.push(geoContentPath(organizationSlug, postId));
            }}
            onRescanPrompt={(row) => rescanPrompt.mutate(row.id)}
            onRunScan={() => startScan.mutate("gaps_empty")}
            onWritePrompt={(row) => {
              openDialog(
                writeDialogStateFromGap({
                  promptId: row.id,
                  prompt: row.prompt,
                  mentionedEngines: row.mentionedEngines,
                  missingEngines: row.engines,
                  mentionedCompetitors: [
                    ...row.competitors,
                    ...row.discoveredCompetitors,
                  ],
                })
              );
            }}
            dismissingSearchId={
              dismissSuggestion.isPending
                ? (dismissSuggestion.variables?.suggestionId ?? null)
                : null
            }
            onDismissSearch={(row) => {
              dismissSuggestion.mutate(
                { suggestionId: row.id },
                {
                  onSuccess: () => {
                    toast.success(GEO_SEARCH_GAP_DISMISSED_TOAST);
                  },
                }
              );
            }}
            onWriteSearch={(row, existingPageUrl) => {
              openDialog({
                sourceKind: "search_console",
                sourceId: row.id,
                topic: row.prompt,
                existingPageUrl,
              });
            }}
            organizationSlug={organizationSlug}
            promptGaps={gapsQuery.data?.promptGaps ?? []}
            searchGaps={gapsQuery.data?.searchGaps ?? []}
          />
        )}
      </div>

      {organizationId ? (
        <WriteDialog
          entry={GEO_WRITE_DIALOG_ENTRIES.GAP}
          initial={dialogInitial}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
        />
      ) : null}
    </PageContainer>
  );
}
