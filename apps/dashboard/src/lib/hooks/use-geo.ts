"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import {
  GEO_SCAN_POLL_INTERVAL_MS,
  GEO_START_SCAN_MUTATION_KEY,
} from "@/constants/geo";
import type {
  AiTrafficResponse,
  GeoCompetitorDeleteInput,
  GeoCompetitorDetailResponse,
  GeoCompetitorShareResponse,
  GeoCompetitorsResponse,
  GeoCompetitorUpsertInput,
  GeoGenerateFromWebsiteInput,
  GeoIngestSetupResponse,
  GeoJourneyDetailResponse,
  GeoLanguageShareResponse,
  GeoModelUsageResponse,
  GeoOverviewResponse,
  GeoProject,
  GeoProjectCreateInput,
  GeoProjectsResponse,
  GeoPromptCreateInput,
  GeoPromptDeleteInput,
  GeoPromptResultsResponse,
  GeoPromptSequence,
  GeoPromptSuggestionsResponse,
  GeoPromptToggleInput,
  GeoSequenceCreateInput,
  GeoSequenceDeleteInput,
  GeoSequenceResultsResponse,
  GeoSequencesResponse,
  GeoSequenceUpdateInput,
  GeoSettingsResponse,
  GeoSettingsUpsertInput,
  GeoSuggestionIdInput,
  GeoTimeseriesResponse,
  GeoTrackedPromptsResponse,
  GeoTrafficJourneysResponse,
  GeoTrafficLogFilters,
  GeoTrafficLogResponse,
  GeoTrafficPagesResponse,
} from "@/types/geo";
import type {
  GeoSearchConsoleStatus,
  GscSelectSiteInput,
  GscSyncResult,
} from "@/types/google-search-console";
import {
  toGeoTrafficLogPurposeFilter,
  toGeoTrafficLogVisitorFilter,
} from "@/utils/ai-traffic";
import { geoCompetitorDetailPath } from "@/utils/geo-competitors";
import { dashboardOrpc } from "../orpc/query";

const DEFAULT_GEO_DAYS = 30;
const DEFAULT_COMPETITOR_DAYS = 30;
const GSC_ANALYZE_MUTATION_KEY = "gsc-analyze" as const;

function gscAnalyzeMutationKey(organizationId: string) {
  return [GSC_ANALYZE_MUTATION_KEY, organizationId] as const;
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function invalidateCompetitorQueries(
  queryClient: QueryClient,
  organizationId: string,
  projectId: string | undefined
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.competitors.queryKey({
        input: { organizationId, projectId },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.settings.queryKey({
        input: { organizationId, projectId },
      }),
    }),
  ]);
}

async function invalidatePromptQueries(
  queryClient: QueryClient,
  organizationId: string,
  projectId: string | undefined
) {
  await queryClient.invalidateQueries({
    queryKey: dashboardOrpc.geo.promptsList.queryKey({
      input: { organizationId, projectId },
    }),
  });
}

async function invalidateGeoScanResultQueries(
  queryClient: QueryClient,
  organizationId: string,
  projectId: string | undefined
) {
  const input = { organizationId, projectId };
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.overview.queryKey({
        input: { ...input, days: DEFAULT_GEO_DAYS },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.timeseries.queryKey({
        input: { ...input, days: DEFAULT_GEO_DAYS },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.promptResults.queryKey({ input }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.competitorShare.queryKey({
        input: { ...input, days: DEFAULT_COMPETITOR_DAYS },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.languageShare.queryKey({
        input: { ...input, days: DEFAULT_GEO_DAYS },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.modelUsage.queryKey({
        input: { ...input, days: DEFAULT_GEO_DAYS },
      }),
    }),
  ]);
}

function geoStartScanMutationKey(
  organizationId: string,
  projectId: string | undefined
) {
  return [GEO_START_SCAN_MUTATION_KEY, organizationId, projectId] as const;
}

async function invalidateSequenceQueries(
  queryClient: QueryClient,
  organizationId: string,
  projectId: string | undefined
) {
  await queryClient.invalidateQueries({
    queryKey: dashboardOrpc.geo.sequencesList.queryKey({
      input: { organizationId, projectId },
    }),
  });
}

export function useGeoSettings(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  const wasScanningRef = useRef<boolean | null>(null);

  const query = useQuery<GeoSettingsResponse>({
    ...dashboardOrpc.geo.settings.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    refetchInterval: (current) =>
      current.state.data?.settings?.isScanning
        ? GEO_SCAN_POLL_INTERVAL_MS
        : false,
    meta: { errorMessage: "Failed to load AI visibility settings" },
  });

  const isScanning = query.data?.settings?.isScanning ?? false;

  useEffect(() => {
    const wasScanning = wasScanningRef.current;
    wasScanningRef.current = isScanning;
    if (wasScanning === true && !isScanning) {
      invalidateGeoScanResultQueries(
        queryClient,
        organizationId,
        projectId
      ).catch(() => undefined);
    }
  }, [isScanning, organizationId, projectId, queryClient]);

  return query;
}

export function useGeoSettingsUpsert(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoSettingsUpsertInput) =>
      dashboardOrpc.geo.settingsUpsert.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidateCompetitorQueries(queryClient, organizationId, projectId);
      toast.success("AI visibility settings saved");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to save settings"));
    },
  });
}

export function useGeoOverview(organizationId: string, days?: number) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoOverviewResponse>({
    ...dashboardOrpc.geo.overview.queryOptions({
      input: { organizationId, projectId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI visibility overview" },
  });
}

export function useGeoTimeseries(organizationId: string, days?: number) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoTimeseriesResponse>({
    ...dashboardOrpc.geo.timeseries.queryOptions({
      input: { organizationId, projectId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI visibility trend" },
  });
}

export function useGeoPromptResults(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoPromptResultsResponse>({
    ...dashboardOrpc.geo.promptResults.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load prompt results" },
  });
}

export function useGeoCompetitorShare(organizationId: string, days?: number) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoCompetitorShareResponse>({
    ...dashboardOrpc.geo.competitorShare.queryOptions({
      input: {
        organizationId,
        projectId,
        days: days ?? DEFAULT_COMPETITOR_DAYS,
      },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load competitor share" },
  });
}

export function useGeoCompetitorDetail(
  organizationId: string,
  brand: string | null,
  days?: number
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoCompetitorDetailResponse>({
    ...dashboardOrpc.geo.competitorDetail.queryOptions({
      input: {
        organizationId,
        projectId,
        brand: brand ?? "",
        days: days ?? DEFAULT_COMPETITOR_DAYS,
      },
    }),
    enabled: !!organizationId && !!brand,
    meta: { errorMessage: "Failed to load competitor detail" },
  });
}

export function usePrefetchGeoCompetitorDetail(organizationId: string) {
  const queryClient = useQueryClient();
  const { projectId } = useGeoProjectScope();

  return (brand: string) => {
    if (!organizationId || brand.length === 0) {
      return;
    }
    return queryClient.prefetchQuery(
      dashboardOrpc.geo.competitorDetail.queryOptions({
        input: {
          organizationId,
          projectId,
          brand,
          days: DEFAULT_COMPETITOR_DAYS,
        },
      })
    );
  };
}

function geoCompetitorRowHref(organizationSlug: string, brand: string): string {
  if (brand === CHART_OTHER_SLICE_LABEL) {
    return `/${organizationSlug}/geo/competitors`;
  }
  return geoCompetitorDetailPath(organizationSlug, brand);
}

/**
 * Row navigation for competitor lists/charts. The aggregated "Other" slice
 * routes to the competitors index; every other brand opens its detail page
 * (and prefetches its detail query on hover).
 */
export function useGeoCompetitorRowNavigation(
  organizationSlug: string | undefined,
  organizationId: string | undefined
) {
  const router = useRouter();
  const prefetchDetail = usePrefetchGeoCompetitorDetail(organizationId ?? "");

  const openRow = (brand: string) => {
    if (!organizationSlug) {
      return;
    }
    router.push(geoCompetitorRowHref(organizationSlug, brand));
  };

  const prefetchRow = (brand: string) => {
    if (!organizationSlug) {
      return;
    }
    router.prefetch(geoCompetitorRowHref(organizationSlug, brand));
    if (brand !== CHART_OTHER_SLICE_LABEL) {
      prefetchDetail(brand);
    }
  };

  return { openRow, prefetchRow };
}

export function useGeoCompetitors(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoCompetitorsResponse>({
    ...dashboardOrpc.geo.competitors.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load competitors" },
  });
}

export function useGeoCompetitorUpsert(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoCompetitorUpsertInput) =>
      dashboardOrpc.geo.competitorUpsert.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidateCompetitorQueries(queryClient, organizationId, projectId);
      toast.success("Competitor saved");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to save competitor"));
    },
  });
}

export function useGeoCompetitorDelete(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoCompetitorDeleteInput) =>
      dashboardOrpc.geo.competitorDelete.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidateCompetitorQueries(queryClient, organizationId, projectId);
      toast.success("Competitor removed");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to remove competitor"));
    },
  });
}

export function useGeoLanguageShare(organizationId: string, days?: number) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoLanguageShareResponse>({
    ...dashboardOrpc.geo.languageShare.queryOptions({
      input: { organizationId, projectId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load language performance" },
  });
}

export function useModelUsage(organizationId: string, days?: number) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoModelUsageResponse>({
    ...dashboardOrpc.geo.modelUsage.queryOptions({
      input: { organizationId, projectId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load model usage share" },
  });
}

export function useGeoPrompts(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoTrackedPromptsResponse>({
    ...dashboardOrpc.geo.promptsList.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load tracked prompts" },
  });
}

export function useGeoPromptCreate(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoPromptCreateInput) =>
      dashboardOrpc.geo.promptsCreate.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidatePromptQueries(queryClient, organizationId, projectId);
      toast.success("Prompt added");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to add prompt"));
    },
  });
}

export function useGeoPromptDelete(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoPromptDeleteInput) =>
      dashboardOrpc.geo.promptsDelete.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidatePromptQueries(queryClient, organizationId, projectId);
      toast.success("Prompt removed");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to remove prompt"));
    },
  });
}

export function useGeoPromptToggle(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoPromptToggleInput) =>
      dashboardOrpc.geo.promptsToggle.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidatePromptQueries(queryClient, organizationId, projectId);
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to update prompt"));
    },
  });
}

export function useGeoGenerateFromWebsite(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoGenerateFromWebsiteInput) =>
      dashboardOrpc.geo.generateFromWebsite.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await Promise.all([
        invalidateCompetitorQueries(queryClient, organizationId, projectId),
        invalidatePromptQueries(queryClient, organizationId, projectId),
      ]);
      toast.success("GEO tracking generated from website");
    },
    onError: (error) => {
      toast.error(
        toErrorMessage(error, "Failed to generate GEO tracking from website")
      );
    },
  });
}

export function useGeoStartScan(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: geoStartScanMutationKey(organizationId, projectId),
    mutationFn: () =>
      dashboardOrpc.geo.startScan.call({ organizationId, projectId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.settings.queryKey({
          input: { organizationId, projectId },
        }),
      });
      toast.success("Scan started");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to start scan"));
    },
  });
}

export function useIsGeoScanning(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const { data } = useGeoSettings(organizationId);
  const pendingCount = useIsMutating({
    mutationKey: geoStartScanMutationKey(organizationId, projectId),
  });
  return pendingCount > 0 || Boolean(data?.settings?.isScanning);
}

export function useAiTraffic(organizationId: string, days?: number) {
  const { projectId } = useGeoProjectScope();
  return useQuery<AiTrafficResponse>({
    ...dashboardOrpc.geo.aiTraffic.queryOptions({
      input: { organizationId, projectId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI traffic" },
  });
}

export function useGeoTrafficLog(
  organizationId: string,
  filters: GeoTrafficLogFilters
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoTrafficLogResponse>({
    ...dashboardOrpc.geo.trafficLog.queryOptions({
      input: {
        organizationId,
        projectId,
        visitorTypes: toGeoTrafficLogVisitorFilter(filters.visitorTypes),
        categories: toGeoTrafficLogPurposeFilter(filters.categories),
      },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI tracking log" },
  });
}

export function useGeoTrafficPages(organizationId: string, days?: number) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoTrafficPagesResponse>({
    ...dashboardOrpc.geo.trafficPages.queryOptions({
      input: { organizationId, projectId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load top AI pages" },
  });
}

export function useGeoTrafficJourneys(organizationId: string, days?: number) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoTrafficJourneysResponse>({
    ...dashboardOrpc.geo.trafficJourneys.queryOptions({
      input: { organizationId, projectId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI journeys" },
  });
}

export function useGeoJourneyDetail(
  organizationId: string,
  journeyId: string | null,
  days?: number
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoJourneyDetailResponse>({
    ...dashboardOrpc.geo.journeyDetail.queryOptions({
      input: {
        organizationId,
        projectId,
        journeyId: journeyId ?? "",
        days: days ?? DEFAULT_GEO_DAYS,
      },
    }),
    enabled: !!organizationId && !!journeyId,
    meta: { errorMessage: "Failed to load journey detail" },
  });
}

export function useGeoIngestSetup(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoIngestSetupResponse>({
    ...dashboardOrpc.geo.ingestSetup.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load tracking setup" },
  });
}

export function useGeoProjects(organizationId: string) {
  return useQuery<GeoProjectsResponse>({
    ...dashboardOrpc.geo.projectsList.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load projects" },
  });
}

export function useGeoProjectCreate(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoProjectCreateInput): Promise<GeoProject> =>
      dashboardOrpc.geo.projectsCreate.call({ ...input, organizationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.projectsList.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("Project created");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to create project"));
    },
  });
}

export function useGeoSequences(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoSequencesResponse>({
    ...dashboardOrpc.geo.sequencesList.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load conversations" },
  });
}

export function useGeoSequenceResults(
  organizationId: string,
  sequenceId?: string
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoSequenceResultsResponse>({
    ...dashboardOrpc.geo.sequenceResults.queryOptions({
      input: { organizationId, projectId, sequenceId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load conversation results" },
  });
}

export function useGeoSequenceCreate(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoSequenceCreateInput): Promise<GeoPromptSequence> =>
      dashboardOrpc.geo.sequencesCreate.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidateSequenceQueries(queryClient, organizationId, projectId);
      toast.success("Conversation added");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to add conversation"));
    },
  });
}

export function useGeoSequenceUpdate(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoSequenceUpdateInput): Promise<GeoPromptSequence> =>
      dashboardOrpc.geo.sequencesUpdate.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidateSequenceQueries(queryClient, organizationId, projectId);
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to update conversation"));
    },
  });
}

export function useGeoSequenceDelete(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: GeoSequenceDeleteInput
    ): Promise<{ success: boolean }> =>
      dashboardOrpc.geo.sequencesDelete.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidateSequenceQueries(queryClient, organizationId, projectId);
      toast.success("Conversation removed");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to remove conversation"));
    },
  });
}

function describeSyncResult(result: GscSyncResult): string {
  if (result.status !== "completed") {
    return "Search Console sync skipped";
  }
  const added = result.suggestionsAdded ?? 0;
  if (added === 0) {
    return (result.keywords ?? 0) === 0
      ? "Search Console has no search data for this property yet"
      : "Search Console synced — no new prompt suggestions";
  }
  return `${added} new prompt suggestion${added === 1 ? "" : "s"} from Search Console`;
}

export function useGscStatus(organizationId: string) {
  return useQuery<GeoSearchConsoleStatus>({
    ...dashboardOrpc.geo.searchConsoleStatus.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load Search Console status" },
  });
}

function useInvalidateGscQueries(organizationId: string) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.searchConsoleStatus.queryKey({
          input: { organizationId },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.suggestionsList.queryKey({
          input: { organizationId },
        }),
      }),
    ]);
  };
}

export function useGscAnalyzing(organizationId: string): boolean {
  return (
    useIsMutating({
      mutationKey: gscAnalyzeMutationKey(organizationId),
    }) > 0
  );
}

export function useGscSelectSite(organizationId: string) {
  const invalidate = useInvalidateGscQueries(organizationId);
  return useMutation({
    mutationKey: gscAnalyzeMutationKey(organizationId),
    mutationFn: (input: GscSelectSiteInput) =>
      dashboardOrpc.geo.searchConsoleSelectSite.call({
        ...input,
        organizationId,
      }),
    onSuccess: async (result) => {
      await invalidate();
      toast.success(describeSyncResult(result));
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to select property"));
    },
  });
}

export function useGscSync(organizationId: string) {
  const invalidate = useInvalidateGscQueries(organizationId);
  return useMutation({
    mutationKey: gscAnalyzeMutationKey(organizationId),
    mutationFn: () =>
      dashboardOrpc.geo.searchConsoleSync.call({ organizationId }),
    onSuccess: async (result) => {
      await invalidate();
      toast.success(describeSyncResult(result));
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to sync Search Console"));
    },
  });
}

export function useGscClearSite(organizationId: string) {
  const invalidate = useInvalidateGscQueries(organizationId);
  return useMutation({
    mutationFn: () =>
      dashboardOrpc.geo.searchConsoleClearSite.call({ organizationId }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to change property"));
    },
  });
}

export function useGscDisconnect(organizationId: string) {
  const invalidate = useInvalidateGscQueries(organizationId);
  return useMutation({
    mutationFn: () =>
      dashboardOrpc.geo.searchConsoleDisconnect.call({ organizationId }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Google Search Console disconnected");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to disconnect"));
    },
  });
}

export function useGeoSuggestions(organizationId: string) {
  return useQuery<GeoPromptSuggestionsResponse>({
    ...dashboardOrpc.geo.suggestionsList.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load prompt suggestions" },
  });
}

function useInvalidateSuggestionQueries(organizationId: string) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.suggestionsList.queryKey({
          input: { organizationId },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.promptsList.queryKey({
          input: { organizationId },
        }),
      }),
    ]);
  };
}

export function useGeoSuggestionAccept(organizationId: string) {
  const invalidate = useInvalidateSuggestionQueries(organizationId);
  return useMutation({
    mutationFn: (input: GeoSuggestionIdInput) =>
      dashboardOrpc.geo.suggestionAccept.call({ ...input, organizationId }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Prompt added to tracking");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to add prompt"));
    },
  });
}

export function useGeoSuggestionsAcceptAll(organizationId: string) {
  const invalidate = useInvalidateSuggestionQueries(organizationId);
  return useMutation({
    mutationFn: () =>
      dashboardOrpc.geo.suggestionsAcceptAll.call({ organizationId }),
    onSuccess: async (result) => {
      await invalidate();
      toast.success(
        `${result.accepted} prompt${result.accepted === 1 ? "" : "s"} added to tracking`
      );
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to add prompts"));
    },
  });
}

export function useGeoSuggestionDismiss(organizationId: string) {
  const invalidate = useInvalidateSuggestionQueries(organizationId);
  return useMutation({
    mutationFn: (input: GeoSuggestionIdInput) =>
      dashboardOrpc.geo.suggestionDismiss.call({ ...input, organizationId }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to dismiss suggestion"));
    },
  });
}
