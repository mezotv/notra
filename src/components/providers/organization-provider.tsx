"use client";

import { useQueries } from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { type ReactNode, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import {
  activeOrganizationAtom,
  getOrganizationBySlugAtom,
  isLoadingOrganizationsAtom,
  organizationsAtom,
} from "@/utils/atoms/organizations";
import { QUERY_KEYS } from "@/utils/query-keys";

export type Organization = NonNullable<
  ReturnType<typeof authClient.useListOrganizations>["data"]
>[number];

export function OrganizationsProvider({ children }: { children: ReactNode }) {
  const setOrganizations = useSetAtom(organizationsAtom);
  const setActiveOrganization = useSetAtom(activeOrganizationAtom);
  const setIsLoading = useSetAtom(isLoadingOrganizationsAtom);

  const [
    { data: organizationsData, isPending: isLoadingOrgs },
    { data: activeOrganization, isPending: isLoadingActive },
  ] = useQueries({
    queries: [
      {
        queryKey: QUERY_KEYS.AUTH.organizations,
        queryFn: async () => {
          const result = await authClient.organization.list();
          return result.data ?? [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - org list changes rarely
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
      {
        queryKey: QUERY_KEYS.AUTH.activeOrganization,
        queryFn: async () => {
          const result = await authClient.organization.getFullOrganization();
          return result.data ?? null;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    ],
  });

  useEffect(() => {
    if (organizationsData) {
      setOrganizations(organizationsData);
    }
  }, [organizationsData, setOrganizations]);

  useEffect(() => {
    setActiveOrganization(activeOrganization ?? null);
  }, [activeOrganization, setActiveOrganization]);

  useEffect(() => {
    setIsLoading(isLoadingOrgs || isLoadingActive);
  }, [isLoadingOrgs, isLoadingActive, setIsLoading]);

  return <>{children}</>;
}

export function useOrganizationsContext() {
  const organizations = useAtomValue(organizationsAtom);
  const activeOrganization = useAtomValue(activeOrganizationAtom);
  const isLoading = useAtomValue(isLoadingOrganizationsAtom);
  const [getOrganizationBySlug] = useAtom(getOrganizationBySlugAtom);

  return {
    organizations,
    activeOrganization,
    isLoading,
    getOrganization: getOrganizationBySlug,
  };
}
