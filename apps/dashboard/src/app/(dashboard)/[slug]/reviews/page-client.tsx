"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { cn } from "@notra/ui/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { ReviewsInboxRow } from "@/components/reviews/reviews-inbox-row";
import { useMemberPermissions } from "@/lib/hooks/use-member-permissions";
import { useReviewsInbox } from "@/lib/hooks/use-reviews";
import { useSlugOrganization } from "@/lib/hooks/use-slug-organization";
import type { ReviewsPageClientProps } from "@/types/reviews";
import Loading from "./loading";
import { ReviewsInboxSkeleton } from "./skeleton";

const HEADER_CLASS = "text-muted-foreground text-xs uppercase tracking-wider";

export default function PageClient({
  organizationSlug,
}: ReviewsPageClientProps) {
  const organization = useSlugOrganization();
  const organizationId = organization?.id ?? "";

  const { hasScope, isLoading: isLoadingPermissions } =
    useMemberPermissions(organizationId);
  const canReview = hasScope("posts:review");
  const { data, isPending } = useReviewsInbox(organizationId, canReview);

  if (isLoadingPermissions) {
    return <Loading />;
  }

  const items = data?.items ?? [];

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-2xl tracking-tight">Reviews</h1>
          <p className="text-muted-foreground text-sm">
            Posts waiting on your approval.
          </p>
        </div>

        {!canReview && (
          <EmptyState
            className="p-8"
            description="Ask a workspace admin for a role that can review posts."
            title="You do not have access to reviews"
          />
        )}

        {canReview && isPending && <ReviewsInboxSkeleton />}

        {canReview && !isPending && items.length === 0 && (
          <EmptyState
            className="p-8"
            description="You have no posts waiting on your review."
            title="All caught up"
          />
        )}

        {canReview && !isPending && items.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-muted/80 shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(HEADER_CLASS, "min-w-[16rem]")}>
                    Post
                  </TableHead>
                  <TableHead className={cn(HEADER_CLASS, "w-[10rem]")}>
                    Type
                  </TableHead>
                  <TableHead className={cn(HEADER_CLASS, "w-[12rem]")}>
                    Requested by
                  </TableHead>
                  <TableHead className={cn(HEADER_CLASS, "w-[14rem]")}>
                    Current step
                  </TableHead>
                  <TableHead
                    className={cn(HEADER_CLASS, "w-[20rem] text-right")}
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <ReviewsInboxRow
                    item={item}
                    key={item.requestId}
                    organizationId={organizationId}
                    organizationSlug={organizationSlug}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
