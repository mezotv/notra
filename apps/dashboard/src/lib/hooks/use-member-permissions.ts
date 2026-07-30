"use client";

import type { OrganizationScope } from "@notra/db/types/access-groups";
import { useQuery } from "@tanstack/react-query";
import { dashboardOrpc } from "../orpc/query";

export function useMemberPermissions(organizationId: string) {
  const query = useQuery(
    dashboardOrpc.accessGroups.me.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );

  const scopes = query.data?.scopes;

  const hasScope = (scope: OrganizationScope) =>
    scopes?.includes(scope) ?? false;

  return {
    isLoading: query.isLoading,
    scopes: scopes ?? [],
    memberRole: query.data?.memberRole ?? null,
    accessGroups: query.data?.accessGroups ?? [],
    hasScope,
  };
}
