"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
} from "@/schemas/reviews";
import { dashboardOrpc } from "../orpc/query";

export function useApprovalWorkflows(organizationId: string) {
  return useQuery(
    dashboardOrpc.reviews.workflows.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
}

function useWorkflowsInvalidation(organizationId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardOrpc.reviews.workflows.list.queryKey({
        input: { organizationId },
      }),
    });
  };
}

export function useCreateWorkflow(organizationId: string) {
  const invalidate = useWorkflowsInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: Omit<CreateWorkflowInput, "organizationId">) =>
      dashboardOrpc.reviews.workflows.create.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}

export function useUpdateWorkflow(organizationId: string) {
  const invalidate = useWorkflowsInvalidation(organizationId);

  return useMutation({
    mutationFn: (input: Omit<UpdateWorkflowInput, "organizationId">) =>
      dashboardOrpc.reviews.workflows.update.call({ organizationId, ...input }),
    onSuccess: invalidate,
  });
}

export function useDeleteWorkflow(organizationId: string) {
  const invalidate = useWorkflowsInvalidation(organizationId);

  return useMutation({
    mutationFn: (workflowId: string) =>
      dashboardOrpc.reviews.workflows.delete.call({
        organizationId,
        workflowId,
      }),
    onSuccess: invalidate,
  });
}
