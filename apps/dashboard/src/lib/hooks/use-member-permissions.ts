"use client";

import type { OrganizationScope } from "@notra/db/types/roles";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { dashboardOrpc } from "../orpc/query";

export function useMemberPermissions(organizationId: string) {
  const query = useQuery(
    dashboardOrpc.roles.me.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );

  const scopes = query.data?.scopes;

  const hasScope = useCallback(
    (scope: OrganizationScope) => scopes?.includes(scope) ?? false,
    [scopes]
  );

  return {
    isLoading: query.isLoading,
    scopes: scopes ?? [],
    memberRole: query.data?.memberRole ?? null,
    roles: query.data?.roles ?? [],
    hasScope,
  };
}
