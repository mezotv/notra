"use client";

import {
  CheckmarkCircle02Icon,
  MessageEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { TableCell, TableRow } from "@notra/ui/components/ui/table";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getContentTypeLabel } from "@/components/content/content-card";
import { RequestChangesDialog } from "@/components/content/request-changes-dialog";
import { useReviewPost } from "@/lib/hooks/use-reviews";
import type { ReviewsInboxRowProps } from "@/types/reviews";
import { formatRelativeDate } from "@/utils/content-preview";
import { OutputTypeIcon } from "@/utils/output-types";

export function ReviewsInboxRow({
  item,
  organizationId,
  organizationSlug,
}: ReviewsInboxRowProps) {
  const reviewMutation = useReviewPost(organizationId);
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const href = `/${organizationSlug}/content/${item.contentId}`;

  return (
    <TableRow>
      <TableCell className="py-3">
        <Link className="line-clamp-1 font-medium hover:underline" href={href}>
          {item.title}
        </Link>
        {item.workflowName && (
          <span className="text-muted-foreground text-xs">
            {item.workflowName}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          className="flex w-fit items-center gap-1 capitalize"
          variant="secondary"
        >
          <OutputTypeIcon className="size-3" outputType={item.contentType} />
          {getContentTypeLabel(item.contentType)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <span className="block text-foreground">{item.requestedByName}</span>
        {formatRelativeDate(item.requestedAt)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <span className="block text-foreground">
          Step {item.stepOrder} of {item.totalSteps}
          {item.stepName ? `: ${item.stepName}` : ""}
        </span>
        {item.reviewerAccessGroupName}
        {" · "}
        {item.approvals}/{item.requiredApprovals} approved
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Button
            nativeButton={false}
            render={<Link href={href}>Review</Link>}
            size="sm"
            variant="ghost"
          />
          <Button
            disabled={reviewMutation.isPending}
            onClick={() =>
              reviewMutation.mutate({
                contentId: item.contentId,
                decision: "approved",
              })
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
            disabled={reviewMutation.isPending}
            onClick={() => setRequestChangesOpen(true)}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon className="size-4" icon={MessageEdit01Icon} />
            Request changes
          </Button>
        </div>
        <RequestChangesDialog
          isPending={reviewMutation.isPending}
          onConfirm={(comment) =>
            reviewMutation.mutate(
              {
                contentId: item.contentId,
                decision: "changes_requested",
                comment: comment || undefined,
              },
              { onSuccess: () => setRequestChangesOpen(false) }
            )
          }
          onOpenChange={setRequestChangesOpen}
          open={requestChangesOpen}
        />
      </TableCell>
    </TableRow>
  );
}
