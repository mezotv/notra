"use client";

import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { gscAnalyzeMutationKey } from "@/constants/google-search-console";
import type {
  AiTrafficResponse,
  BeaconSetupResponse,
  GeoCompetitorShareResponse,
  GeoGenerateFromWebsiteInput,
  GeoLanguageShareResponse,
  GeoModelUsageResponse,
  GeoOverviewResponse,
  GeoPromptCreateInput,
  GeoPromptDeleteInput,
  GeoPromptResultsResponse,
  GeoPromptSuggestionsResponse,
  GeoPromptToggleInput,
  GeoSearchConsoleStatus,
  GeoSettingsResponse,
  GeoSettingsUpsertInput,
  GeoSuggestionIdInput,
  GeoTimeseriesResponse,
  GeoTrackedPromptsResponse,
  GscSelectSiteInput,
  GscSyncResult,
} from "@/types/geo";
import { dashboardOrpc } from "../orpc/query";

const DEFAULT_GEO_DAYS = 30;
const DEFAULT_COMPETITOR_DAYS = 30;

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useGeoSettings(organizationId: string) {
  return useQuery<GeoSettingsResponse>({
    ...dashboardOrpc.geo.settings.queryOptions({ input: { organizationId } }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI visibility settings" },
  });
}

export function useGeoSettingsUpsert(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoSettingsUpsertInput) =>
      dashboardOrpc.geo.settingsUpsert.call({ ...input, organizationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.settings.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("AI visibility settings saved");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to save settings"));
    },
  });
}

export function useGeoOverview(organizationId: string, days?: number) {
  return useQuery<GeoOverviewResponse>({
    ...dashboardOrpc.geo.overview.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI visibility overview" },
  });
}

export function useGeoTimeseries(organizationId: string, days?: number) {
  return useQuery<GeoTimeseriesResponse>({
    ...dashboardOrpc.geo.timeseries.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI visibility trend" },
  });
}

export function useGeoPromptResults(organizationId: string) {
  return useQuery<GeoPromptResultsResponse>({
    ...dashboardOrpc.geo.promptResults.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load prompt results" },
  });
}

export function useGeoCompetitorShare(organizationId: string, days?: number) {
  return useQuery<GeoCompetitorShareResponse>({
    ...dashboardOrpc.geo.competitorShare.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_COMPETITOR_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load competitor share" },
  });
}

export function useGeoLanguageShare(organizationId: string, days?: number) {
  return useQuery<GeoLanguageShareResponse>({
    ...dashboardOrpc.geo.languageShare.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load language performance" },
  });
}

export function useModelUsage(organizationId: string, days?: number) {
  return useQuery<GeoModelUsageResponse>({
    ...dashboardOrpc.geo.modelUsage.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load model usage share" },
  });
}

export function useGeoPrompts(organizationId: string) {
  return useQuery<GeoTrackedPromptsResponse>({
    ...dashboardOrpc.geo.promptsList.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load tracked prompts" },
  });
}

export function useGeoPromptCreate(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoPromptCreateInput) =>
      dashboardOrpc.geo.promptsCreate.call({ ...input, organizationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.promptsList.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("Prompt added");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to add prompt"));
    },
  });
}

export function useGeoPromptDelete(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoPromptDeleteInput) =>
      dashboardOrpc.geo.promptsDelete.call({ ...input, organizationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.promptsList.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("Prompt removed");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to remove prompt"));
    },
  });
}

export function useGeoPromptToggle(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoPromptToggleInput) =>
      dashboardOrpc.geo.promptsToggle.call({ ...input, organizationId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.promptsList.queryKey({
          input: { organizationId },
        }),
      });
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to update prompt"));
    },
  });
}

export function useGeoGenerateFromWebsite(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoGenerateFromWebsiteInput) =>
      dashboardOrpc.geo.generateFromWebsite.call({ ...input, organizationId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.geo.settings.queryKey({
            input: { organizationId },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.geo.promptsList.queryKey({
            input: { organizationId },
          }),
        }),
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
  return useMutation({
    mutationFn: () => dashboardOrpc.geo.startScan.call({ organizationId }),
    onSuccess: () => {
      toast.success("Scan started");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to start scan"));
    },
  });
}

export function useAiTraffic(organizationId: string, days?: number) {
  return useQuery<AiTrafficResponse>({
    ...dashboardOrpc.geo.aiTraffic.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI traffic" },
  });
}

export function useBeaconSetup(organizationId: string) {
  return useQuery<BeaconSetupResponse>({
    ...dashboardOrpc.geo.beaconSetup.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load beacon setup" },
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
