"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OnboardingStatus } from "@/types/hooks/onboarding";
import { dashboardOrpc } from "../orpc/query";

export const AGENT_RUN_POLL_INTERVAL_MS = 10_000;
const AGENT_RUN_STALE_TIME_MS = 60_000;
const SUGGESTIONS_STALE_TIME_MS = 300_000;

export function useOnboardingStatus(
  organizationId: string,
  options?: { refetchInterval?: number | false }
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
  const wasRunningRef = useRef(false);

  const query = useQuery(
    dashboardOrpc.onboarding.agentRun.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
      staleTime: AGENT_RUN_STALE_TIME_MS,
      refetchInterval: (current) =>
        current.state.data?.running ? AGENT_RUN_POLL_INTERVAL_MS : false,
    })
  );

  const running = query.data?.running ?? false;

  // When a run finishes, refresh the checklist and suggestions it produced.
  useEffect(() => {
    if (organizationId && wasRunningRef.current && !running) {
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
    wasRunningRef.current = running;
  }, [running, organizationId, queryClient]);

  return query;
}

export function useOnboardingSuggestions(
  organizationId: string,
  options?: { agentRunning?: boolean }
) {
  return useQuery(
    dashboardOrpc.onboarding.suggestions.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
      staleTime: SUGGESTIONS_STALE_TIME_MS,
      refetchInterval: options?.agentRunning
        ? AGENT_RUN_POLL_INTERVAL_MS
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

/**
 * Owns the create-from-suggestion flow shared by the automation pages:
 * remember which suggestion opened the create dialog, dismiss it when the
 * dialog succeeds, and forget it when the dialog closes without creating.
 */
export function useCreateFromSuggestion(organizationId: string | undefined) {
  const [pendingSuggestionId, setPendingSuggestionId] = useState<string | null>(
    null
  );
  const { mutate: dismissSuggestion } = useDismissOnboardingSuggestion();

  const beginCreate = useCallback((suggestionId: string) => {
    setPendingSuggestionId(suggestionId);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setPendingSuggestionId(null);
    }
  }, []);

  const handleCreateSuccess = useCallback(() => {
    if (organizationId && pendingSuggestionId) {
      dismissSuggestion({
        organizationId,
        suggestionId: pendingSuggestionId,
      });
      setPendingSuggestionId(null);
    }
  }, [organizationId, pendingSuggestionId, dismissSuggestion]);

  return { beginCreate, handleDialogOpenChange, handleCreateSuccess };
}
