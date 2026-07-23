"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { SOCIAL_PLATFORM_LABELS } from "@/constants/social-connect";
import type { SocialConnectPlatform } from "@/schemas/social-accounts";
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

export function useConnectSocialAccount(
  organizationId: string,
  platform: SocialConnectPlatform
) {
  return useMutation({
    mutationFn: async (callbackPath: string): Promise<{ url: string }> => {
      return dashboardOrpc.socialAccounts.beginConnect.call({
        organizationId,
        platform,
        callbackPath,
      });
    },
  });
}

export function useHandleConnectSocialAccount(
  organizationId: string,
  platform: SocialConnectPlatform
) {
  const connectAccount = useConnectSocialAccount(organizationId, platform);

  const handleConnect = useCallback(async () => {
    try {
      const result = await connectAccount.mutateAsync(
        window.location.pathname + window.location.search
      );
      window.location.href = result.url;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to connect ${SOCIAL_PLATFORM_LABELS[platform]} account`
      );
    }
  }, [connectAccount, platform]);

  return { handleConnect, isPending: connectAccount.isPending };
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
