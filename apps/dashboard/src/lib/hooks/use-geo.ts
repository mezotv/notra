"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
  keepPreviousData,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import {
  GEO_BRAND_SEARCH_MIN_QUERY_LENGTH,
  GEO_BRAND_SEARCH_STALE_MS,
  GEO_MODEL_CATALOG_STALE_MS,
  GEO_SCAN_POLL_INTERVAL_MS,
  GEO_START_SCAN_MUTATION_KEY,
} from "@/constants/geo";
import { localStorageKeys } from "@/constants/storage";
import { geoDbOrgQueryKey, geoDbQueryKey } from "@/lib/db/geo-collections";
import type {
  AiTrafficResponse,
  GeoBrandSearchResponse,
  GeoCompetitorDetailResponse,
  GeoCompetitorShareResponse,
  GeoCompetitorSuggestionsResponse,
  GeoCompetitorsResponse,
  GeoDiscoverWebsiteResult,
  GeoGenerateFromWebsiteInput,
  GeoIngestSetupResponse,
  GeoJourneyDetailResponse,
  GeoLanguageShareResponse,
  GeoModelCatalog,
  GeoModelUsageResponse,
  GeoOnboardingBrandInput,
  GeoOnboardingBrandResult,
  GeoOverviewResponse,
  GeoProject,
  GeoProjectCreateInput,
  GeoProjectsResponse,
  GeoPromptResultsResponse,
  GeoPromptSuggestionsResponse,
  GeoRangeQuery,
  GeoSequenceResultsResponse,
  GeoSettingsResponse,
  GeoSettingsUpsertInput,
  GeoSettingsUpsertOptions,
  GeoSuggestionIdInput,
  GeoTimeseriesResponse,
  GeoTrackedPromptsResponse,
  GeoTrafficJourneysResponse,
  GeoTrafficLogFilters,
  GeoTrafficLogQueryOptions,
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
import { toErrorMessage } from "@/utils/error-message";
import { geoCompetitorDetailPath } from "@/utils/geo-competitors";
import { withGeoProject } from "@/utils/geo-paths";
import { toGeoWindowInput } from "@/utils/geo-range";
import { dashboardOrpc } from "../orpc/query";

const GSC_ANALYZE_MUTATION_KEY = "gsc-analyze" as const;

function gscAnalyzeMutationKey(organizationId: string) {
  return [GSC_ANALYZE_MUTATION_KEY, organizationId] as const;
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
    queryClient.invalidateQueries({
      queryKey: geoDbQueryKey("competitors", { organizationId, projectId }),
    }),
  ]);
}

async function invalidatePromptQueries(
  queryClient: QueryClient,
  organizationId: string,
  projectId: string | undefined
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.promptsList.queryKey({
        input: { organizationId, projectId },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: geoDbQueryKey("prompts", { organizationId, projectId }),
    }),
  ]);
}

async function invalidateGeoScanResultQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.overview.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.timeseries.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.promptResults.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.competitorShare.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.languageShare.key(),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.modelUsage.key(),
    }),
  ]);
}

function geoStartScanMutationKey(
  organizationId: string,
  projectId: string | undefined
) {
  return [GEO_START_SCAN_MUTATION_KEY, organizationId, projectId] as const;
}

export function useGeoModelCatalog(organizationId: string) {
  return useQuery<GeoModelCatalog>({
    ...dashboardOrpc.geo.modelCatalog.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    staleTime: GEO_MODEL_CATALOG_STALE_MS,
    meta: { errorMessage: "Failed to load the model catalog" },
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
      invalidateGeoScanResultQueries(queryClient).catch(() => undefined);
    }
  }, [isScanning, queryClient]);

  return query;
}

export function useGeoSettingsUpsert(
  organizationId: string,
  options?: GeoSettingsUpsertOptions
) {
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
      if (!options?.silentSuccess) {
        toast.success("AI visibility settings saved");
      }
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to save settings"));
    },
  });
}

export function useGeoOverview(organizationId: string, range?: GeoRangeQuery) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoOverviewResponse>({
    ...dashboardOrpc.geo.overview.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Failed to load AI visibility overview" },
  });
}

export function useGeoTimeseries(
  organizationId: string,
  range?: GeoRangeQuery
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoTimeseriesResponse>({
    ...dashboardOrpc.geo.timeseries.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Failed to load AI visibility trend" },
  });
}

export function useGeoPromptResults(
  organizationId: string,
  range?: GeoRangeQuery
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoPromptResultsResponse>({
    ...dashboardOrpc.geo.promptResults.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Failed to load prompt results" },
  });
}

export function useGeoCompetitorShare(
  organizationId: string,
  range?: GeoRangeQuery
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoCompetitorShareResponse>({
    ...dashboardOrpc.geo.competitorShare.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Failed to load competitor share" },
  });
}

export function useGeoCompetitorDetail(
  organizationId: string,
  brand: string | null,
  range?: GeoRangeQuery
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoCompetitorDetailResponse>({
    ...dashboardOrpc.geo.competitorDetail.queryOptions({
      input: {
        organizationId,
        projectId,
        brand: brand ?? "",
        ...toGeoWindowInput(range),
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
          ...toGeoWindowInput(undefined),
        },
      })
    );
  };
}

function geoCompetitorRowHref(
  organizationSlug: string,
  brand: string,
  projectId?: string
): string {
  if (brand === CHART_OTHER_SLICE_LABEL) {
    return withGeoProject(`/${organizationSlug}/geo/competitors`, projectId);
  }
  return withGeoProject(
    geoCompetitorDetailPath(organizationSlug, brand),
    projectId
  );
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
  const { projectId } = useGeoProjectScope();
  const prefetchDetail = usePrefetchGeoCompetitorDetail(organizationId ?? "");

  const openRow = (brand: string) => {
    if (!organizationSlug) {
      return;
    }
    router.push(geoCompetitorRowHref(organizationSlug, brand, projectId));
  };

  const prefetchRow = (brand: string) => {
    if (!organizationSlug) {
      return;
    }
    router.prefetch(geoCompetitorRowHref(organizationSlug, brand, projectId));
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

export function useGeoLanguageShare(
  organizationId: string,
  range?: GeoRangeQuery
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoLanguageShareResponse>({
    ...dashboardOrpc.geo.languageShare.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Failed to load language performance" },
  });
}

export function useModelUsage(organizationId: string, range?: GeoRangeQuery) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoModelUsageResponse>({
    ...dashboardOrpc.geo.modelUsage.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
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

export function useGeoDiscoverWebsite(
  organizationId: string,
  url: string | null
) {
  return useQuery<GeoDiscoverWebsiteResult>({
    ...dashboardOrpc.geo.discoverWebsite.queryOptions({
      input: { organizationId, url: url ?? "" },
    }),
    enabled: !!organizationId && url !== null,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}

export function useGeoOnboardingBrand(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useMutation({
    mutationFn: (
      input: Omit<GeoOnboardingBrandInput, "organizationId" | "projectId">
    ): Promise<GeoOnboardingBrandResult> =>
      dashboardOrpc.geo.onboardingBrand.call({
        ...input,
        organizationId,
        projectId,
      }),
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to save your brand"));
    },
  });
}

export function useGeoCompetitorSuggestions(
  organizationId: string,
  domain: string | null
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoCompetitorSuggestionsResponse>({
    ...dashboardOrpc.geo.competitorSuggestions.queryOptions({
      input: { organizationId, projectId, domain: domain ?? "" },
    }),
    enabled: !!organizationId && domain !== null,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}

export function useGeoBrandSearch(organizationId: string, query: string) {
  const { projectId } = useGeoProjectScope();
  const trimmed = query.trim();
  return useQuery<GeoBrandSearchResponse>({
    ...dashboardOrpc.geo.brandSearch.queryOptions({
      input: { organizationId, projectId, query: trimmed },
    }),
    enabled:
      !!organizationId && trimmed.length >= GEO_BRAND_SEARCH_MIN_QUERY_LENGTH,
    staleTime: GEO_BRAND_SEARCH_STALE_MS,
    placeholderData: keepPreviousData,
    retry: false,
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

export function useAiTraffic(organizationId: string, range?: GeoRangeQuery) {
  const { projectId } = useGeoProjectScope();
  return useQuery<AiTrafficResponse>({
    ...dashboardOrpc.geo.aiTraffic.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI traffic" },
  });
}

export function useGeoTrafficLog(
  organizationId: string,
  filters: GeoTrafficLogFilters,
  options?: GeoTrafficLogQueryOptions
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
    placeholderData: keepPreviousData,
    refetchInterval: options?.refetchInterval,
    meta: { errorMessage: "Failed to load AI tracking log" },
  });
}

export function useGeoTrafficPages(
  organizationId: string,
  range?: GeoRangeQuery
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoTrafficPagesResponse>({
    ...dashboardOrpc.geo.trafficPages.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load top AI pages" },
  });
}

export function useGeoTrafficJourneys(
  organizationId: string,
  range?: GeoRangeQuery
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoTrafficJourneysResponse>({
    ...dashboardOrpc.geo.trafficJourneys.queryOptions({
      input: { organizationId, projectId, ...toGeoWindowInput(range) },
    }),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Failed to load AI journeys" },
  });
}

export function useGeoJourneyDetail(
  organizationId: string,
  journeyId: string | null,
  range?: GeoRangeQuery
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoJourneyDetailResponse>({
    ...dashboardOrpc.geo.journeyDetail.queryOptions({
      input: {
        organizationId,
        projectId,
        journeyId: journeyId ?? "",
        ...toGeoWindowInput(range),
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

export function useGeoIngestTokenRotate(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<GeoIngestSetupResponse> =>
      dashboardOrpc.geo.ingestTokenRotate.call({ organizationId, projectId }),
    onSuccess: async (setup) => {
      queryClient.setQueryData(
        dashboardOrpc.geo.ingestSetup.queryKey({
          input: { organizationId, projectId },
        }),
        setup
      );
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.ingestSetup.queryKey({
          input: { organizationId, projectId },
        }),
      });
      toast.success("Tracking token rotated");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to rotate the token"));
    },
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
      queryClient.invalidateQueries({
        queryKey: geoDbOrgQueryKey("prompts", organizationId),
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

const gscCardDismissListeners = new Set<() => void>();

function subscribeToGscCardDismissal(callback: () => void) {
  gscCardDismissListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    gscCardDismissListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function useGscCardDismissal(organizationId: string) {
  const storageKey = localStorageKeys.gscCardDismissed(organizationId);
  const dismissed = useSyncExternalStore(
    subscribeToGscCardDismissal,
    () => localStorage.getItem(storageKey) === "true",
    () => false
  );
  const dismiss = () => {
    localStorage.setItem(storageKey, "true");
    for (const listener of gscCardDismissListeners) {
      listener();
    }
  };
  return { dismiss, dismissed };
}
