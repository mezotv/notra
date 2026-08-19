"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useSocialOverview } from "@/lib/hooks/use-social-analytics";
import type {
  AnalyticsAccountsView,
  AnalyticsContextValue,
  AnalyticsProviderProps,
} from "@/types/analytics";
import type { ChartColorPair, ChartConfig } from "@/types/charts";
import { accountSeriesKey } from "@/utils/analytics-charts";
import {
  accountSeriesColorPair,
  accountSeriesColors,
} from "@/utils/chart-colors";

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  organizationSlug,
  children,
}: AnalyticsProviderProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: overview, isPending } = useSocialOverview(organizationId);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const toggleAccount = useCallback((key: string) => {
    setHiddenKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      organizationId,
      organizationSlug,
      accounts: overview?.accounts ?? [],
      configured: overview?.configured !== false,
      isPending,
      hiddenKeys,
      toggleAccount,
    }),
    [
      organizationId,
      organizationSlug,
      overview?.accounts,
      overview?.configured,
      isPending,
      hiddenKeys,
      toggleAccount,
    ]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext(): AnalyticsContextValue {
  const value = useContext(AnalyticsContext);
  if (!value) {
    throw new Error(
      "useAnalyticsContext must be used within AnalyticsProvider"
    );
  }
  return value;
}

export function useAnalyticsAccounts(): AnalyticsAccountsView {
  const context = useAnalyticsContext();
  const { accounts, hiddenKeys } = context;

  const accountConfig = useMemo(() => {
    const config: ChartConfig = {};
    accounts.forEach((account, index) => {
      config[accountSeriesKey(account.provider, account.providerAccountId)] = {
        label: `@${account.username}`,
        colors: accountSeriesColors(index),
      };
    });
    return config;
  }, [accounts]);

  const accountColors = useMemo(() => {
    const map = new Map<string, ChartColorPair>();
    accounts.forEach((account, index) => {
      map.set(
        accountSeriesKey(account.provider, account.providerAccountId),
        accountSeriesColorPair(index)
      );
    });
    return map;
  }, [accounts]);

  const allKeys = useMemo(
    () =>
      accounts.map((account) =>
        accountSeriesKey(account.provider, account.providerAccountId)
      ),
    [accounts]
  );

  const visibleKeys = useMemo(
    () => allKeys.filter((key) => !hiddenKeys.has(key)),
    [allKeys, hiddenKeys]
  );

  const selectedKeys = useMemo(() => new Set(visibleKeys), [visibleKeys]);

  const visibleAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        selectedKeys.has(
          accountSeriesKey(account.provider, account.providerAccountId)
        )
      ),
    [accounts, selectedKeys]
  );

  return {
    ...context,
    allKeys,
    accountConfig,
    accountColors,
    visibleKeys,
    selectedKeys,
    visibleAccounts,
  };
}
