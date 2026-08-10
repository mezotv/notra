"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
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

export function useGeoSettings(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoSettingsResponse>({
    ...dashboardOrpc.geo.settings.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load AI visibility settings" },
  });
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
  return useMutation({
    mutationFn: () =>
      dashboardOrpc.geo.startScan.call({ organizationId, projectId }),
    onSuccess: () => {
      toast.success("Scan started");
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to start scan"));
    },
  });
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
