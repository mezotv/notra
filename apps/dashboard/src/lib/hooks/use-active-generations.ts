"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type {
  ActiveGeneration,
  GenerationResult,
} from "@/types/generations/tracking";
import { dashboardOrpc } from "../orpc/query";

const ACTIVE_POLL_INTERVAL = 3000;
const IDLE_POLL_INTERVAL = 30_000;

interface ActiveGenerationsResponse {
  generations: ActiveGeneration[];
  results: GenerationResult[];
}

export function useActiveGenerations(organizationId: string) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const previousCountRef = useRef<number | null>(null);
  const toastedResultsRef = useRef(new Set<string>());
  const slug = pathname.split("/").filter(Boolean)[0];
  const logsPath = slug ? `/${slug}/logs` : "/logs";

  const query = useQuery<ActiveGenerationsResponse>(
    dashboardOrpc.content.activeGenerations.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
      meta: { errorMessage: "Failed to load active generations" },
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data && data.generations.length > 0) {
          return ACTIVE_POLL_INTERVAL;
        }
        return IDLE_POLL_INTERVAL;
      },
    })
  );

  const clearResult = useMutation(
    dashboardOrpc.content.activeGenerations.clearCompleted.mutationOptions()
  );

  useEffect(() => {
    const generations = query.data?.generations ?? [];
    const currentCount = generations.length;
    const previousCount = previousCountRef.current;

    if (previousCount !== null && previousCount > 0 && currentCount === 0) {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.content.list.key(),
      });
    }

    previousCountRef.current = currentCount;
  }, [query.data?.generations?.length, queryClient]);

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
          toast.error("Content generation failed", {
            action: {
              label: "View logs",
              onClick: () => router.push(logsPath),
            },
            description: "Check the logs page for details.",
          });
        }

        clearResultMutate({
          organizationId,
          runId: result.runId,
        });
      }
    },
    [clearResultMutate, logsPath, organizationId, router]
  );

  useEffect(() => {
    const results = query.data?.results ?? [];
    if (results.length > 0) {
      processResults(results);
    }
  }, [processResults, query.data?.results]);

  return {
    ...query,
    data: query.data?.generations,
  };
}
