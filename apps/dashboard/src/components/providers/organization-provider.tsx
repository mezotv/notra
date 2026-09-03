"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useOrganizationSwitch } from "@/components/providers/organization-switch-provider";
import { authClient } from "@/lib/auth/client";
import { setLastVisitedOrganization } from "@/utils/cookies";
import { serializeOrganizationMutation } from "@/utils/organization-mutation";
import {
  getOrganizationSlugFromPathname,
  maskOrganizationPathname,
} from "@/utils/organization-pathname";
import { QUERY_KEYS } from "@/utils/query-keys";

export type Organization = NonNullable<
  ReturnType<typeof authClient.useListOrganizations>["data"]
>[number];

export type InitialActiveOrganization = Organization;

interface OrganizationsContextValue {
  organizations: Organization[];
  activeOrganization: Organization | null;
  isLoading: boolean;
  getOrganization: (slug: string) => Organization | undefined;
}

const OrganizationsContext = createContext<OrganizationsContextValue | null>(
  null
);

const FALLBACK_ORGANIZATIONS_CONTEXT: OrganizationsContextValue = {
  organizations: [],
  activeOrganization: null,
  isLoading: true,
  getOrganization: () => undefined,
};

export function OrganizationsProvider({
  children,
  initialActiveOrganization,
}: {
  children: ReactNode;
  initialActiveOrganization?: InitialActiveOrganization | null;
}) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const {
    activateOrganization,
    cancelOrganizationSwitch,
    getOrganizationSwitchTargetSlug,
    isOrganizationSwitching,
    markOrganizationPathSettled,
    organizationSwitchId,
  } = useOrganizationSwitch();
  const hasAutoSelectedRef = useRef(false);
  const lastSyncedSlugRef = useRef<string | null>(null);
  const [optimisticActiveOrg, setOptimisticActiveOrg] =
    useState<Organization | null>(null);

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
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
      {
        queryKey: QUERY_KEYS.AUTH.activeOrganization,
        queryFn: async () => {
          const result = await authClient.organization.getFullOrganization();
          if (result.error) {
            throw new Error(result.error.message);
          }
          return result.data ?? null;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    ],
  });

  const organizations =
    organizationsData ?? FALLBACK_ORGANIZATIONS_CONTEXT.organizations;
  const isLoading = isLoadingOrgs || isLoadingActive;
  const slugFromPath = useMemo(
    () => getOrganizationSlugFromPathname(pathname),
    [pathname]
  );
  const organizationFromPath = useMemo(
    () =>
      slugFromPath
        ? (organizations.find((org) => org.slug === slugFromPath) ?? null)
        : null,
    [organizations, slugFromPath]
  );
  const seededActiveOrganization = useMemo(() => {
    if (!initialActiveOrganization) {
      return null;
    }

    if (slugFromPath && initialActiveOrganization.slug !== slugFromPath) {
      return null;
    }

    return initialActiveOrganization;
  }, [initialActiveOrganization, slugFromPath]);
  const activeOrganizationForPath =
    !slugFromPath || activeOrganization?.slug === slugFromPath
      ? activeOrganization
      : null;
  const optimisticActiveOrgForPath =
    !slugFromPath || optimisticActiveOrg?.slug === slugFromPath
      ? optimisticActiveOrg
      : null;
  const resolvedActiveOrganization = slugFromPath
    ? (organizationFromPath ??
      activeOrganizationForPath ??
      optimisticActiveOrgForPath ??
      seededActiveOrganization)
    : (activeOrganization ?? optimisticActiveOrg ?? seededActiveOrganization);

  // Clear optimistic state when real data arrives
  const [prevActiveOrganization, setPrevActiveOrganization] =
    useState(activeOrganization);
  if (activeOrganization !== prevActiveOrganization) {
    setPrevActiveOrganization(activeOrganization);
    if (activeOrganization) {
      setOptimisticActiveOrg(null);
    }
  }

  useEffect(() => {
    if (resolvedActiveOrganization?.slug !== slugFromPath) {
      return;
    }

    setLastVisitedOrganization(slugFromPath).catch(() => {
      // The active server session is still synchronized below if cookies fail.
    });
  }, [resolvedActiveOrganization?.slug, slugFromPath]);

  useEffect(() => {
    if (isLoadingOrgs || isLoadingActive) {
      return;
    }
    if (!slugFromPath) {
      lastSyncedSlugRef.current = null;
      if (organizationSwitchId !== null) {
        cancelOrganizationSwitch(organizationSwitchId);
      }
      markOrganizationPathSettled(null, null);
      return;
    }
    const switchTargetSlug = getOrganizationSwitchTargetSlug();
    if (isOrganizationSwitching && switchTargetSlug === slugFromPath) {
      return;
    }
    if (!isOrganizationSwitching && activeOrganization?.slug === slugFromPath) {
      lastSyncedSlugRef.current = slugFromPath;
      markOrganizationPathSettled(slugFromPath, activeOrganization.id);
      return;
    }

    if (!organizationFromPath) {
      return;
    }
    if (lastSyncedSlugRef.current === slugFromPath) {
      return;
    }

    lastSyncedSlugRef.current = slugFromPath;
    setOptimisticActiveOrg(organizationFromPath);
    activateOrganization(organizationFromPath.slug, organizationFromPath.id)
      .then((result) => {
        if (
          result.status === "failed" ||
          result.status === "confirmation-failed"
        ) {
          console.error("Failed to sync organization:", result.message);
          setOptimisticActiveOrg(null);
          lastSyncedSlugRef.current = organizationFromPath.slug;
          if (result.status === "failed" && activeOrganization?.slug) {
            const fallbackPath = maskOrganizationPathname(
              pathname,
              activeOrganization.slug
            );
            // react-doctor-disable-next-line nextjs-no-client-side-redirect -- async failure recovery after URL-to-session sync
            router.replace(`${fallbackPath}${window.location.search}`);
          }
        }
      })
      .catch((error) => {
        console.error("Error syncing organization:", error);
        setOptimisticActiveOrg(null);
        lastSyncedSlugRef.current = organizationFromPath.slug;
      });
  }, [
    activeOrganization?.id,
    activeOrganization?.slug,
    activateOrganization,
    cancelOrganizationSwitch,
    getOrganizationSwitchTargetSlug,
    isOrganizationSwitching,
    isLoadingActive,
    isLoadingOrgs,
    organizationFromPath,
    markOrganizationPathSettled,
    organizationSwitchId,
    pathname,
    router,
    slugFromPath,
  ]);

  // Auto-select first organization if no active organization is set
  useEffect(() => {
    if (
      !(isLoadingOrgs || isLoadingActive) &&
      organizationsData &&
      organizationsData.length > 0 &&
      !activeOrganization &&
      !slugFromPath &&
      !hasAutoSelectedRef.current
    ) {
      const firstOrg = organizationsData[0];
      if (firstOrg) {
        hasAutoSelectedRef.current = true;
        setOptimisticActiveOrg(firstOrg);
        serializeOrganizationMutation(() =>
          authClient.organization.setActive({ organizationId: firstOrg.id })
        )
          .then((result) => {
            if (result.error) {
              console.error(
                "Failed to auto-set active organization:",
                result.error
              );
              setOptimisticActiveOrg(null);
              hasAutoSelectedRef.current = false;
            } else {
              queryClient.invalidateQueries({ refetchType: "none" });
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.AUTH.activeOrganization,
              });
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.AUTH.session,
              });
            }
          })
          .catch((error) => {
            console.error("Error auto-setting active organization:", error);
            setOptimisticActiveOrg(null);
            hasAutoSelectedRef.current = false;
          });
      }
    }
    if (activeOrganization === null && hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = false;
    }
  }, [
    isLoadingOrgs,
    isLoadingActive,
    organizationsData,
    activeOrganization,
    queryClient,
    router,
    slugFromPath,
  ]);

  const getOrganization = useCallback(
    (slug: string) =>
      organizations.find((org) => org.slug === slug) ??
      (resolvedActiveOrganization?.slug === slug
        ? resolvedActiveOrganization
        : undefined),
    [organizations, resolvedActiveOrganization]
  );

  const contextValue = useMemo<OrganizationsContextValue>(
    () => ({
      organizations,
      activeOrganization: resolvedActiveOrganization,
      isLoading,
      getOrganization,
    }),
    [organizations, resolvedActiveOrganization, isLoading, getOrganization]
  );

  return (
    <OrganizationsContext.Provider value={contextValue}>
      {children}
    </OrganizationsContext.Provider>
  );
}

export function useOrganizationsContext() {
  const context = useContext(OrganizationsContext);
  if (!context) {
    return FALLBACK_ORGANIZATIONS_CONTEXT;
  }
  return context;
}
