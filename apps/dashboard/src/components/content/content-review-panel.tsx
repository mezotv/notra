"use client";

import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReviewStepsChain } from "@/components/content/review-steps-chain";
import { useReviewState } from "@/lib/hooks/use-reviews";
import type {
  ContentReviewPanelProps,
  ReviewCommentsProps,
} from "@/types/reviews";

function ReviewComments({ reviews }: ReviewCommentsProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1.5">
      {reviews.map((review) => (
        <li className="text-sm" key={review.id}>
          <span className="font-medium">{review.reviewerName}</span>
          <span className="text-muted-foreground">
            {review.comment ? `: ${review.comment}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ContentReviewPanel({
  organizationId,
  contentId,
  status,
}: ContentReviewPanelProps) {
  const { data: state } = useReviewState(organizationId, contentId);

  if (!state) {
    return null;
  }

  const request = state.request;

  if (request) {
    return (
      <section className="space-y-2.5 rounded-lg border border-border/80 bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <HugeiconsIcon
            className="size-4 text-violet-600 dark:text-violet-300"
            icon={Clock01Icon}
          />
          <span className="font-medium">In review</span>
          {request.workflowName && (
            <>
              <span aria-hidden>·</span>
              <span className="text-muted-foreground">
                {request.workflowName}
              </span>
            </>
          )}
          {request.requestedByName && (
            <>
              <span aria-hidden>·</span>
              <span className="text-muted-foreground">
                Requested by {request.requestedByName}
              </span>
            </>
          )}
        </div>
        <ReviewStepsChain steps={request.steps} />
        <ReviewComments
          reviews={request.reviews.filter((review) => review.comment)}
        />
      </section>
    );
  }

  const lastRequest = state.lastRequest;

  if (status === "draft" && lastRequest?.status === "rejected") {
    return (
      <section className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
        <div className="flex items-center gap-2 text-sm">
          <HugeiconsIcon
            className="size-4 text-amber-700 dark:text-amber-300"
            icon={AlertCircleIcon}
          />
          <span className="font-medium">Changes requested</span>
        </div>
        <ReviewComments
          reviews={lastRequest.reviews.filter(
            (review) => review.decision === "changes_requested"
          )}
        />
      </section>
    );
  }

  if (status === "approved") {
    return (
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <HugeiconsIcon
          className="size-4 text-emerald-600 dark:text-emerald-300"
          icon={CheckmarkCircle02Icon}
        />
        Approved and ready to publish
      </p>
    );
  }

  return null;
}
