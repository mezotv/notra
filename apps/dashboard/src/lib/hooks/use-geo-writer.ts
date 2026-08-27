"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import { GEO_WRITER_BRIEF_POLL_INTERVAL_MS } from "@/constants/geo";
import type {
  GeoContentBriefDetail,
  GeoContentBriefsResponse,
  GeoContentGapsResponse,
  GeoWriterPlanInput,
} from "@/types/geo";
import { toErrorMessage } from "@/utils/error-message";

import { dashboardOrpc } from "../orpc/query";

export function useGeoWriterGaps(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoContentGapsResponse>({
    ...dashboardOrpc.geo.writerGaps.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load content gaps" },
  });
}

export function useGeoWriterBriefs(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoContentBriefsResponse>({
    ...dashboardOrpc.geo.writerBriefsList.queryOptions({
      input: { organizationId, projectId },
    }),
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load briefs" },
  });
}

export function useGeoWriterBrief(
  organizationId: string,
  briefId: string | null
) {
  const { projectId } = useGeoProjectScope();
  return useQuery<GeoContentBriefDetail>({
    ...dashboardOrpc.geo.writerBrief.queryOptions({
      input: { organizationId, projectId, briefId: briefId ?? "" },
    }),
    enabled: !!organizationId && !!briefId,
    refetchInterval: (query) =>
      query.state.data?.status === "writing" ||
      query.state.data?.status === "approved"
        ? GEO_WRITER_BRIEF_POLL_INTERVAL_MS
        : false,
    meta: { errorMessage: "Failed to load the brief" },
  });
}

function useInvalidateWriterQueries(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.writerBriefsList.queryKey({
        input: { organizationId, projectId },
      }),
    });
    await queryClient.invalidateQueries({
      queryKey: dashboardOrpc.geo.writerGaps.queryKey({
        input: { organizationId, projectId },
      }),
    });
  };
}

export function useGeoWriterPlan(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const invalidate = useInvalidateWriterQueries(organizationId);
  return useMutation({
    mutationFn: (input: GeoWriterPlanInput) =>
      dashboardOrpc.geo.writerPlan.call({
        ...input,
        organizationId,
        projectId,
      }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to plan the article"));
    },
  });
}

export function useGeoWriterStart(organizationId: string) {
  const { projectId } = useGeoProjectScope();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateWriterQueries(organizationId);
  return useMutation({
    mutationFn: (briefId: string) =>
      dashboardOrpc.geo.writerStart.call({
        organizationId,
        projectId,
        briefId,
      }),
    onSuccess: async (_result, briefId) => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.geo.writerBrief.queryKey({
            input: { organizationId, projectId, briefId },
          }),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, "Failed to start writing"));
    },
  });
}
