"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { UpdateBrandSettingsInput } from "@/schemas/brand";
import type {
  AffectedTriggersData,
  DeleteResourceResponse,
} from "@/schemas/integrations";
import type {
  BrandSettings,
  BrandSettingsResponse,
  Progress,
  ProgressResponse,
} from "@/types/hooks/brand-analysis";
import { QUERY_KEYS } from "@/utils/query-keys";

export function useBrandSettings(organizationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BRAND.settings(organizationId),
    queryFn: async (): Promise<BrandSettingsResponse> => {
      const res = await fetch(`/api/organizations/${organizationId}/brand`);
      if (!res.ok) {
        throw new Error("Failed to fetch brand settings");
      }
      return res.json();
    },
    enabled: !!organizationId,
  });
}

export function useBrandAnalysisProgress(
  organizationId: string,
  onFailure?: (error: string) => void,
  onAnalysisComplete?: () => void
) {
  const queryClient = useQueryClient();
  const hasReset = useRef(false);
  const forcePollUntilMs = useRef<number | null>(null);
  const lastFailureMessage = useRef<string | null>(null);

  const shouldForcePoll = () => {
    const untilMs = forcePollUntilMs.current;
    return typeof untilMs === "number" && Date.now() < untilMs;
  };

  const query = useQuery({
    queryKey: QUERY_KEYS.BRAND.progress(organizationId),
    queryFn: async (): Promise<Progress> => {
      const res = await fetch(
        `/api/organizations/${organizationId}/brand/progress`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch progress");
      }

      const data: ProgressResponse = await res.json();
      const progress = data.progress;

      if (
        progress.status === "failed" &&
        progress.error &&
        lastFailureMessage.current !== progress.error
      ) {
        onFailure?.(progress.error);
        lastFailureMessage.current = progress.error;
      }

      if (progress.status !== "failed" && lastFailureMessage.current) {
        lastFailureMessage.current = null;
      }

      if (progress.status === "idle" && shouldForcePoll()) {
        const cached = queryClient.getQueryData<Progress>(
          QUERY_KEYS.BRAND.progress(organizationId)
        );
        if (cached && cached.status !== "idle") {
          return cached;
        }
      }

      if (progress.status !== "idle") {
        forcePollUntilMs.current = null;
      }

      return progress;
    },
    enabled: !!organizationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) {
        return 2000;
      }

      if (data.status === "completed" || data.status === "failed") {
        return false;
      }

      if (data.status === "idle") {
        return shouldForcePoll() ? 1000 : false;
      }

      return 1000;
    },
  });

  const progress = query.data ?? {
    status: "idle" as const,
    currentStep: 0,
    totalSteps: 3,
  };

  const startPolling = () => {
    hasReset.current = false;
    forcePollUntilMs.current = Date.now() + 15_000;

    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.BRAND.progress(organizationId),
    });
  };

  const onComplete = () => {
    hasReset.current = true;
    forcePollUntilMs.current = null;

    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.BRAND.settings(organizationId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.AUTH.organizations,
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.AUTH.activeOrganization,
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
    });
    onAnalysisComplete?.();
  };

  useEffect(() => {
    if (progress.status === "completed" && !hasReset.current) {
      onComplete();
    }
  }, [onComplete, progress.status]);

  return { progress, startPolling };
}

export function useAnalyzeBrand(
  organizationId: string,
  startPolling: () => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { url: string; voiceId?: string }) => {
      const res = await fetch(
        `/api/organizations/${organizationId}/brand/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: params.url,
            voiceId: params.voiceId,
          }),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to start analysis");
      }
      return res.json();
    },
    onMutate: () => {
      queryClient.setQueryData(QUERY_KEYS.BRAND.progress(organizationId), {
        status: "scraping",
        currentStep: 1,
        totalSteps: 3,
      });

      startPolling();
    },
    onSuccess: () => {
      startPolling();
    },
    onError: (error) => {
      queryClient.setQueryData(QUERY_KEYS.BRAND.progress(organizationId), {
        status: "failed",
        currentStep: 0,
        totalSteps: 3,
        error: error instanceof Error ? error.message : "Analysis failed",
      });
    },
  });
}

export function useUpdateBrandSettings(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBrandSettingsInput) => {
      const res = await fetch(`/api/organizations/${organizationId}/brand`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update brand settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BRAND.settings(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
      });
    },
  });
}

export function useCreateBrandVoice(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      websiteUrl: string;
    }): Promise<{ voice: BrandSettings }> => {
      const res = await fetch(`/api/organizations/${organizationId}/brand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create brand voice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BRAND.settings(organizationId),
      });
    },
  });
}

export function useBrandVoiceAffectedTriggers(
  organizationId: string,
  voiceId: string,
  enabled: boolean
) {
  const query = useQuery<AffectedTriggersData>({
    queryKey: ["brand-voice-affected", organizationId, voiceId],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${organizationId}/brand?checkAffected=true&voiceId=${voiceId}`
      );
      if (!res.ok) {
        throw new Error("Failed to check affected triggers");
      }
      return res.json();
    },
    enabled: enabled && !!voiceId,
  });
  return { ...query, isLoading: query.isLoading || query.isFetching };
}

export function useDeleteBrandVoice(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation<DeleteResourceResponse, Error, string>({
    mutationFn: async (voiceId: string) => {
      const res = await fetch(
        `/api/organizations/${organizationId}/brand?id=${voiceId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete brand voice");
      }
      return res.json();
    },
    onSuccess: (_data, voiceId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BRAND.settings(organizationId),
      });
      queryClient.removeQueries({
        queryKey: ["brand-voice-affected", organizationId, voiceId],
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AUTOMATION.base,
      });
    },
  });
}

export function useSetDefaultBrandVoice(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voiceId: string) => {
      const res = await fetch(`/api/organizations/${organizationId}/brand`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: voiceId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set default voice");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BRAND.settings(organizationId),
      });
    },
  });
}
