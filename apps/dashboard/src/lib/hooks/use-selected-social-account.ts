"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useSocialAccounts } from "@/lib/hooks/use-connected-accounts";
import {
  getSelectedSocialAccountId,
  setSelectedSocialAccountId,
  subscribeToSelectedSocialAccountId,
} from "@/lib/state/selected-social-account";
import type { SocialConnectPlatform } from "@/schemas/social-accounts";

export function useSelectedSocialAccount(
  organizationId: string,
  platform: SocialConnectPlatform
) {
  const { accounts, isLoading } = useSocialAccounts(organizationId, platform);

  const selectedAccountId = useSyncExternalStore(
    useCallback(
      (onChange: () => void) =>
        subscribeToSelectedSocialAccountId(organizationId, platform, onChange),
      [organizationId, platform]
    ),
    () => getSelectedSocialAccountId(organizationId, platform),
    () => null
  );

  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ??
    accounts[0] ??
    null;

  const selectAccount = useCallback(
    (accountId: string) =>
      setSelectedSocialAccountId(organizationId, platform, accountId),
    [organizationId, platform]
  );

  return { accounts, isLoading, selectedAccount, selectAccount };
}
