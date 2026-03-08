"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/utils/query-keys";

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

function baseUrl(organizationId: string) {
  return `/api/organizations/${organizationId}/social-accounts`;
}

export function useConnectedAccounts(organizationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CONNECTED_ACCOUNTS.list(organizationId),
    queryFn: async (): Promise<{ accounts: ConnectedAccount[] }> => {
      const res = await fetch(baseUrl(organizationId));
      if (!res.ok) {
        throw new Error("Failed to fetch connected accounts");
      }
      return res.json();
    },
    enabled: !!organizationId,
  });
}

export function useConnectTwitter(organizationId: string) {
  return useMutation({
    mutationFn: async (callbackPath: string): Promise<{ url: string }> => {
      const res = await fetch(
        `${baseUrl(organizationId)}/twitter/authorize?callbackPath=${encodeURIComponent(callbackPath)}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to initiate Twitter OAuth");
      }
      return res.json();
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
      const res = await fetch(`${baseUrl(organizationId)}?id=${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to disconnect account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONNECTED_ACCOUNTS.list(organizationId),
      });
    },
  });
}
