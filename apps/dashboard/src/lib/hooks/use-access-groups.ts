"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateAccessGroupInput,
  UpdateAccessGroupInput,
} from "@/schemas/access-groups";
import { dashboardOrpc } from "../orpc/query";

export function useAccessGroups(organizationId: string) {
  return useQuery(
    dashboardOrpc.accessGroups.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
}

export function useAccessGroupAssignments(organizationId: string) {
  return useQuery(
    dashboardOrpc.accessGroups.assignments.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
}

function useAccessGroupsInvalidation(organizationId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.accessGroups.list.queryKey({
          input: { organizationId },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.accessGroups.assignments.queryKey({
          input: { organizationId },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.accessGroups.me.queryKey({
          input: { organizationId },
        }),
      }),
    ]);
  };
}

export function useCreateAccessGroup(organizationId: string) {
  const invalidate = useAccessGroupsInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: Omit<CreateAccessGroupInput, "organizationId">) =>
      dashboardOrpc.accessGroups.create.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}

export function useUpdateAccessGroup(organizationId: string) {
  const invalidate = useAccessGroupsInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: Omit<UpdateAccessGroupInput, "organizationId">) =>
      dashboardOrpc.accessGroups.update.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}

export function useDeleteAccessGroup(organizationId: string) {
  const invalidate = useAccessGroupsInvalidation(organizationId);

  return useMutation({
    mutationFn: (accessGroupId: string) =>
      dashboardOrpc.accessGroups.delete.call({ organizationId, accessGroupId }),
    onSuccess: invalidate,
  });
}

export function useAssignAccessGroup(organizationId: string) {
  const invalidate = useAccessGroupsInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: { memberId: string; accessGroupId: string }) =>
      dashboardOrpc.accessGroups.assign.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}

export function useUnassignAccessGroup(organizationId: string) {
  const invalidate = useAccessGroupsInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: { memberId: string; accessGroupId: string }) =>
      dashboardOrpc.accessGroups.unassign.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}
