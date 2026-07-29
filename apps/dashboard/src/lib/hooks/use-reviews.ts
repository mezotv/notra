"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidatePostReviewQueries } from "@/lib/reviews/invalidate-queries";
import type {
  ReviewPostMutationInput,
  UpdatePostStatusMutationInput,
} from "@/types/reviews";
import { dashboardOrpc } from "../orpc/query";

export function useReviewState(organizationId: string, contentId: string) {
  return useQuery(
    dashboardOrpc.reviews.state.queryOptions({
      input: { organizationId, contentId },
      enabled: !!organizationId && !!contentId,
    })
  );
}

export function useReviewsInbox(organizationId: string, enabled: boolean) {
  return useQuery(
    dashboardOrpc.reviews.inbox.queryOptions({
      input: { organizationId },
      enabled: !!organizationId && enabled,
    })
  );
}

export function useSubmitForReview(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) =>
      dashboardOrpc.reviews.submit.call({ organizationId, contentId }),
    onSuccess: async (result, contentId) => {
      toast.success(
        result.workflowName
          ? `Submitted for review in ${result.workflowName}`
          : "Submitted for review"
      );
      await invalidatePostReviewQueries({
        queryClient,
        organizationId,
        contentId,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit for review");
    },
  });
}

export function useReviewPost(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentId, decision, comment }: ReviewPostMutationInput) =>
      dashboardOrpc.reviews.review.call({
        organizationId,
        contentId,
        decision,
        comment,
      }),
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.decision === "approved"
          ? "Review approved"
          : "Changes requested"
      );
      await invalidatePostReviewQueries({
        queryClient,
        organizationId,
        contentId: variables.contentId,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });
}

export function useUpdatePostStatus(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentId, status }: UpdatePostStatusMutationInput) =>
      dashboardOrpc.content.update.call({ organizationId, contentId, status }),
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.status === "published"
          ? "Post published"
          : "Post moved to drafts"
      );
      await invalidatePostReviewQueries({
        queryClient,
        organizationId,
        contentId: variables.contentId,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update post status");
    },
  });
}
