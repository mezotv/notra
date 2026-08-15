"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listUsersAction } from "@/lib/auth/admin-actions";
import { signOutAction } from "@/lib/auth/user-actions";
import {
  createOrganizationAction,
  listOrganizationsAction,
  setActiveOrganizationAction,
} from "@/lib/organizations/actions";
import type { ClientSessionData, SignOutOptions } from "@/types/auth";
import { QUERY_KEYS } from "@/utils/query-keys";

async function fetchSession(): Promise<ClientSessionData | null> {
  const response = await fetch("/api/session", { cache: "no-store" });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function useSession() {
  const query = useQuery({
    queryKey: QUERY_KEYS.AUTH.session,
    queryFn: fetchSession,
    staleTime: 60 * 1000,
  });

  return {
    data: query.data ?? null,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

function useListOrganizations() {
  const query = useQuery({
    queryKey: QUERY_KEYS.AUTH.organizations,
    queryFn: async () => {
      const result = await listOrganizationsAction();
      return result.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data ?? null,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

function useSessionInvalidation() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.session });
  };
}

function isNextRedirectError(error: unknown) {
  return (
    error !== null &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

async function signOut(options?: SignOutOptions) {
  try {
    await signOutAction();
  } catch (error) {
    if (!isNextRedirectError(error)) {
      throw error;
    }
  }
  options?.fetchOptions?.onSuccess?.();
}

export const authClient = {
  useSession,
  useListOrganizations,
  useSessionInvalidation,
  signOut,
  organization: {
    create: createOrganizationAction,
    list: listOrganizationsAction,
    setActive: setActiveOrganizationAction,
  },
  admin: {
    listUsers: listUsersAction,
  },
};
