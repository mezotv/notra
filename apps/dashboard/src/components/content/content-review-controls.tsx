"use client";

import {
  CheckmarkCircle02Icon,
  MessageEdit01Icon,
  SentIcon,
  TextIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { RequestChangesDialog } from "@/components/content/request-changes-dialog";
import {
  useReviewPost,
  useReviewState,
  useSubmitForReview,
  useUpdatePostStatus,
} from "@/lib/hooks/use-reviews";
import type { ContentReviewControlsProps } from "@/types/reviews";

export function ContentReviewControls({
  organizationId,
  contentId,
  status,
}: ContentReviewControlsProps) {
  const { data: state } = useReviewState(organizationId, contentId);
  const submitMutation = useSubmitForReview(organizationId);
  const reviewMutation = useReviewPost(organizationId);
  const statusMutation = useUpdatePostStatus(organizationId);
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);

  if (!state) {
    return <Skeleton className="h-8 w-24 rounded-md" />;
  }

  const isBusy =
    submitMutation.isPending ||
    reviewMutation.isPending ||
    statusMutation.isPending;

  const publish = () =>
    statusMutation.mutate({ contentId, status: "published" });
  const moveToDraft = () =>
    statusMutation.mutate({ contentId, status: "draft" });

  const showSubmit = status === "draft" && state.canSubmit;
  const showPublish =
    (status === "draft" || status === "approved") && state.canPublish;
  const showOverridePublish =
    status === "in_review" && state.canPublishOverride;
  const showReviewActions = status === "in_review" && state.canReview;
  const showMoveToDraft =
    status === "published" && (state.canPublish || state.canPublishOverride);

  return (
    <>
      {showSubmit && (
        <Button
          disabled={isBusy}
          onClick={() => submitMutation.mutate(contentId)}
          size="sm"
        >
          {submitMutation.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <HugeiconsIcon className="size-4" icon={UserCheck01Icon} />
          )}
          Submit for review
        </Button>
      )}
      {showReviewActions && (
        <>
          <Button
            disabled={isBusy}
            onClick={() =>
              reviewMutation.mutate({ contentId, decision: "approved" })
            }
            size="sm"
          >
            {reviewMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon className="size-4" icon={CheckmarkCircle02Icon} />
            )}
            Approve
          </Button>
          <Button
            disabled={isBusy}
            onClick={() => setRequestChangesOpen(true)}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon className="size-4" icon={MessageEdit01Icon} />
            Request changes
          </Button>
        </>
      )}
      {showPublish && (
        <Button
          disabled={isBusy}
          onClick={publish}
          size="sm"
          variant={showSubmit ? "outline" : "default"}
        >
          <HugeiconsIcon className="size-4" icon={SentIcon} />
          Publish
        </Button>
      )}
      {showOverridePublish && (
        <Button disabled={isBusy} onClick={publish} size="sm" variant="outline">
          <HugeiconsIcon className="size-4" icon={SentIcon} />
          Publish now
        </Button>
      )}
      {showMoveToDraft && (
        <Button
          disabled={isBusy}
          onClick={moveToDraft}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon className="size-4" icon={TextIcon} />
          Move to draft
        </Button>
      )}
      <RequestChangesDialog
        isPending={reviewMutation.isPending}
        onConfirm={(comment) =>
          reviewMutation.mutate(
            {
              contentId,
              decision: "changes_requested",
              comment: comment || undefined,
            },
            { onSuccess: () => setRequestChangesOpen(false) }
          )
        }
        onOpenChange={setRequestChangesOpen}
        open={requestChangesOpen}
      />
    </>
  );
}
