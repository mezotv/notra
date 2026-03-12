"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type {
  ActiveGeneration,
  GenerationResult,
} from "@/types/generations/tracking";
import { QUERY_KEYS } from "@/utils/query-keys";

const ACTIVE_POLL_INTERVAL = 3000;
const IDLE_POLL_INTERVAL = 30_000;

interface ActiveGenerationsResponse {
  generations: ActiveGeneration[];
  results: GenerationResult[];
}

export function useActiveGenerations(organizationId: string) {
  const queryClient = useQueryClient();
  const previousCountRef = useRef<number | null>(null);
  const toastedResultsRef = useRef(new Set<string>());

  const query = useQuery({
    queryKey: QUERY_KEYS.ACTIVE_GENERATIONS.list(organizationId),
    queryFn: async (): Promise<ActiveGenerationsResponse> => {
      const res = await fetch(
        `/api/organizations/${organizationId}/content/active-generations`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch active generations");
      }

      return res.json();
    },
    enabled: !!organizationId,
    meta: { errorMessage: "Failed to load active generations" },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.generations.length > 0) {
        return ACTIVE_POLL_INTERVAL;
      }
      return IDLE_POLL_INTERVAL;
    },
  });

  const clearResult = useMutation({
    mutationFn: async (runId: string) => {
      const res = await fetch(
        `/api/organizations/${organizationId}/content/active-generations`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to clear result");
      }
    },
  });

  useEffect(() => {
    const generations = query.data?.generations ?? [];
    const currentCount = generations.length;
    const previousCount = previousCountRef.current;

    if (previousCount !== null && previousCount > 0 && currentCount === 0) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.POSTS.list(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.POSTS.today(organizationId),
      });
    }

    previousCountRef.current = currentCount;
  }, [query.data?.generations?.length, organizationId, queryClient]);

  const clearResultMutate = clearResult.mutate;

  const processResults = useCallback(
    (results: GenerationResult[]) => {
      for (const result of results) {
        if (toastedResultsRef.current.has(result.runId)) {
          continue;
        }

        toastedResultsRef.current.add(result.runId);

        if (result.status === "success") {
          toast.success(
            result.title ? `"${result.title}" generated` : "Content generated"
          );
        } else {
          toast.error("Content generation failed, check logs for details");
        }

        clearResultMutate(result.runId);
      }
    },
    [clearResultMutate]
  );

  useEffect(() => {
    const results = query.data?.results ?? [];
    if (results.length > 0) {
      processResults(results);
    }
  }, [query.data?.results, processResults]);

  return {
    ...query,
    data: query.data?.generations,
  };
}
