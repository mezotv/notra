"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { LinkedInSelectionAccount } from "@/types/services/social-connect";

export function useLinkedInSelection(token: string) {
  return useQuery<{
    accounts: LinkedInSelectionAccount[];
    organizationId: string;
    callbackPath: string;
  }>(
    dashboardOrpc.socialAccounts.linkedinSelectionGet.queryOptions({
      input: { token },
      enabled: Boolean(token),
      retry: false,
    })
  );
}

export function useCompleteLinkedInSelection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      token: string;
      accountIds: string[];
    }): Promise<{ callbackPath: string }> =>
      dashboardOrpc.socialAccounts.linkedinSelectionComplete.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.socialAccounts.list.key(),
      });
    },
  });
}
