"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { dashboardOrpc } from "../orpc/query";

export interface ConnectedAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  verified: boolean;
  createdAt: string;
}

export function useConnectedAccounts(organizationId: string) {
  return useQuery<{ accounts: ConnectedAccount[] }>(
    dashboardOrpc.socialAccounts.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
}

export function useConnectTwitter(organizationId: string) {
  return useMutation({
    mutationFn: async (callbackPath: string): Promise<{ url: string }> => {
      return dashboardOrpc.socialAccounts.twitter.beginAuth.call({
        organizationId,
        callbackPath,
      });
    },
  });
}

export function useHandleConnectTwitter(organizationId: string) {
  const connectTwitter = useConnectTwitter(organizationId);

  const handleConnect = useCallback(async () => {
    try {
      const result = await connectTwitter.mutateAsync(
        window.location.pathname + window.location.search
      );
      window.location.href = result.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to connect X account"
      );
    }
  }, [connectTwitter]);

  return { handleConnect, isPending: connectTwitter.isPending };
}

export function useDisconnectAccount(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      return dashboardOrpc.socialAccounts.disconnect.call({
        organizationId,
        accountId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.socialAccounts.list.queryKey({
          input: { organizationId },
        }),
      });
    },
  });
}
