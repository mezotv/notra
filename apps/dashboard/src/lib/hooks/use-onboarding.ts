"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AGENT_RUN_REFETCH_INTERVAL_MS,
  AGENT_RUN_STALE_TIME_MS,
  SUGGESTIONS_STALE_TIME_MS,
} from "@/constants/onboarding-agent";
import type {
  OnboardingRunSnapshot,
  OnboardingStatus,
  PendingOnboardingSuggestion,
  UseOnboardingStatusOptions,
  UseOnboardingSuggestionsOptions,
} from "@/types/hooks/onboarding";
import { dashboardOrpc } from "../orpc/query";

export function useOnboardingStatus(
  organizationId: string,
  options?: UseOnboardingStatusOptions
) {
  return useQuery<OnboardingStatus>(
    dashboardOrpc.onboarding.get.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
      refetchInterval: options?.refetchInterval,
    })
  );
}

export function useOnboardingAgentRun(organizationId: string) {
  const queryClient = useQueryClient();
  const previousRunRef = useRef<OnboardingRunSnapshot | null>(null);

  const query = useQuery(
    dashboardOrpc.onboarding.agentRun.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
      staleTime: AGENT_RUN_STALE_TIME_MS,
      refetchInterval: (current) =>
        current.state.data?.running ? AGENT_RUN_REFETCH_INTERVAL_MS : false,
    })
  );

  const running = query.data?.running ?? false;

  useEffect(() => {
    const previous = previousRunRef.current;
    if (
      organizationId &&
      previous?.organizationId === organizationId &&
      previous.running &&
      !running
    ) {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.onboarding.get.queryKey({
          input: { organizationId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.onboarding.suggestions.queryKey({
          input: { organizationId },
        }),
      });
    }
    previousRunRef.current = organizationId
      ? { organizationId, running }
      : null;
  }, [running, organizationId, queryClient]);

  return query;
}

export function useOnboardingSuggestions(
  organizationId: string,
  options?: UseOnboardingSuggestionsOptions
) {
  return useQuery(
    dashboardOrpc.onboarding.suggestions.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
      staleTime: SUGGESTIONS_STALE_TIME_MS,
      refetchInterval: options?.agentRunning
        ? AGENT_RUN_REFETCH_INTERVAL_MS
        : false,
    })
  );
}

export function useDismissOnboardingSuggestion() {
  const queryClient = useQueryClient();
  return useMutation(
    dashboardOrpc.onboarding.dismissSuggestion.mutationOptions({
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.onboarding.suggestions.queryKey({
            input: { organizationId: variables.organizationId },
          }),
        });
      },
    })
  );
}

export function useCreateFromSuggestion(organizationId: string | undefined) {
  const [pending, setPending] = useState<PendingOnboardingSuggestion | null>(
    null
  );
  const { mutate: dismissSuggestion } = useDismissOnboardingSuggestion();

  const beginCreate = useCallback(
    (suggestionId: string) => {
      setPending(organizationId ? { organizationId, suggestionId } : null);
    },
    [organizationId]
  );

  const cancelCreate = useCallback(
    (suggestion: PendingOnboardingSuggestion | null) => {
      if (!suggestion) {
        return;
      }
      setPending((current) =>
        current?.organizationId === suggestion.organizationId &&
        current.suggestionId === suggestion.suggestionId
          ? null
          : current
      );
    },
    []
  );

  const handleCreateSuccess = useCallback(
    (suggestion: PendingOnboardingSuggestion | null) => {
      if (!suggestion || suggestion.organizationId !== organizationId) {
        return;
      }
      dismissSuggestion(suggestion);
      setPending((current) =>
        current?.organizationId === suggestion.organizationId &&
        current.suggestionId === suggestion.suggestionId
          ? null
          : current
      );
    },
    [organizationId, dismissSuggestion]
  );

  return {
    beginCreate,
    cancelCreate,
    handleCreateSuccess,
    pendingSuggestion: pending,
  };
}
