"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { LinkedInSelectionOptions } from "@/types/services/social-connect";

export function useLinkedInSelectionOptions(state: string, token: string) {
  return useQuery<{
    options: LinkedInSelectionOptions;
    organizationId: string;
    callbackPath: string;
  }>(
    dashboardOrpc.socialAccounts.linkedinSelectionGet.queryOptions({
      input: { state, token },
      enabled: Boolean(state && token),
      retry: false,
    })
  );
}

export function useCompleteLinkedInSelection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      state: string;
      accountType: "personal" | "organization";
      organizationId?: string;
    }): Promise<{ callbackPath: string }> =>
      dashboardOrpc.socialAccounts.linkedinSelectionComplete.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.socialAccounts.key(),
      });
    },
  });
}
