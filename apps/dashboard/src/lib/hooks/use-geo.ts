"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  GeoPromptCreateInput,
  GeoPromptDeleteInput,
  GeoPromptResultsResponse,
  GeoPromptToggleInput,
  GeoSettingsResponse,
  GeoSettingsUpsertInput,
  GeoTimeseriesResponse,
  GeoTrackedPromptsResponse,
  GeoTrafficJourneysResponse,
  GeoTrafficLogFilters,
  GeoTrafficLogResponse,
  GeoTrafficPagesResponse,
} from "@/types/geo";
import {
  toGeoTrafficLogPurposeFilter,
  toGeoTrafficLogVisitorFilter,
} from "@/utils/ai-traffic";
import { dashboardOrpc } from "../orpc/query";

const DEFAULT_GEO_DAYS = 30;
const DEFAULT_COMPETITOR_DAYS = 30;

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function invalidateCompetitorQueries(
  queryClient: QueryClient,
  organizationId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.competitors.queryKey({
        input: { organizationId },
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.settings.queryKey({
        input: { organizationId },
      }),
    }),
  ]);
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
      await invalidateCompetitorQueries(queryClient, organizationId);
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

export function useGeoCompetitorDetail(
  organizationId: string,
  brand: string | null,
  days?: number
) {
  return useQuery<GeoCompetitorDetailResponse>({
    ...dashboardOrpc.geo.competitorDetail.queryOptions({
      input: {
        organizationId,
        brand: brand ?? "",
        days: days ?? DEFAULT_COMPETITOR_DAYS,
      },
    }),
    enabled: !!organizationId && !!brand,
    meta: { errorMessage: "Failed to load competitor detail" },
  });
}

export function useGeoCompetitors(organizationId: string) {
  return useQuery<GeoCompetitorsResponse>({
    ...dashboardOrpc.geo.competitors.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load competitors" },
  });
}

export function useGeoCompetitorUpsert(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoCompetitorUpsertInput) =>
      dashboardOrpc.geo.competitorUpsert.call({ ...input, organizationId }),
    onSuccess: async () => {
      await invalidateCompetitorQueries(queryClient, organizationId);
      toast.success("Competitor saved");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to save competitor"));
    },
  });
}

export function useGeoCompetitorDelete(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeoCompetitorDeleteInput) =>
      dashboardOrpc.geo.competitorDelete.call({ ...input, organizationId }),
    onSuccess: async () => {
      await invalidateCompetitorQueries(queryClient, organizationId);
      toast.success("Competitor removed");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to remove competitor"));
    },
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
        invalidateCompetitorQueries(queryClient, organizationId),
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

export function useGeoTrafficLog(
  organizationId: string,
  filters: GeoTrafficLogFilters
) {
  return useQuery<GeoTrafficLogResponse>({
    ...dashboardOrpc.geo.trafficLog.queryOptions({
      input: {
        organizationId,
        visitorType: toGeoTrafficLogVisitorFilter(filters.visitorType),
        category: toGeoTrafficLogPurposeFilter(filters.category),
      },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI tracking log" },
  });
}

export function useGeoTrafficPages(organizationId: string, days?: number) {
  return useQuery<GeoTrafficPagesResponse>({
    ...dashboardOrpc.geo.trafficPages.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_GEO_DAYS },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load top AI pages" },
  });
}

export function useGeoTrafficJourneys(organizationId: string, days?: number) {
  return useQuery<GeoTrafficJourneysResponse>({
    ...dashboardOrpc.geo.trafficJourneys.queryOptions({
      input: { organizationId, days: days ?? DEFAULT_GEO_DAYS },
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
  return useQuery<GeoJourneyDetailResponse>({
    ...dashboardOrpc.geo.journeyDetail.queryOptions({
      input: {
        organizationId,
        journeyId: journeyId ?? "",
        days: days ?? DEFAULT_GEO_DAYS,
      },
    }),
    enabled: !!organizationId && !!journeyId,
    meta: { errorMessage: "Failed to load journey detail" },
  });
}

export function useGeoIngestSetup(organizationId: string) {
  return useQuery<GeoIngestSetupResponse>({
    ...dashboardOrpc.geo.ingestSetup.queryOptions({
      input: { organizationId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load tracking setup" },
  });
}
