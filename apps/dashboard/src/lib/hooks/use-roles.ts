"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateRoleInput, UpdateRoleInput } from "@/schemas/roles";
import { dashboardOrpc } from "../orpc/query";

export function useRoles(organizationId: string) {
  return useQuery(
    dashboardOrpc.roles.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
}

export function useRoleAssignments(organizationId: string) {
  return useQuery(
    dashboardOrpc.roles.assignments.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
}

function useRolesInvalidation(organizationId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.roles.list.queryKey({
          input: { organizationId },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.roles.assignments.queryKey({
          input: { organizationId },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.roles.me.queryKey({
          input: { organizationId },
        }),
      }),
    ]);
  };
}

export function useCreateRole(organizationId: string) {
  const invalidate = useRolesInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: Omit<CreateRoleInput, "organizationId">) =>
      dashboardOrpc.roles.create.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}

export function useUpdateRole(organizationId: string) {
  const invalidate = useRolesInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: Omit<UpdateRoleInput, "organizationId">) =>
      dashboardOrpc.roles.update.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}

export function useDeleteRole(organizationId: string) {
  const invalidate = useRolesInvalidation(organizationId);

  return useMutation({
    mutationFn: (roleId: string) =>
      dashboardOrpc.roles.delete.call({ organizationId, roleId }),
    onSuccess: invalidate,
  });
}

export function useAssignRole(organizationId: string) {
  const invalidate = useRolesInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: { memberId: string; roleId: string }) =>
      dashboardOrpc.roles.assign.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}

export function useUnassignRole(organizationId: string) {
  const invalidate = useRolesInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: { memberId: string; roleId: string }) =>
      dashboardOrpc.roles.unassign.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}
