import type { InferRouterOutputs } from "@orpc/server";
import type { QueryClient } from "@tanstack/react-query";
import type { DashboardRouter } from "@/lib/orpc/router";
import type { PostStatus } from "@/schemas/content";

type ReviewsRouterOutputs = InferRouterOutputs<DashboardRouter>["reviews"];

type ReviewState = ReviewsRouterOutputs["state"];
type ReviewRequest = NonNullable<ReviewState["request"]>;
type ReviewRequestStep = ReviewRequest["steps"][number];
type ReviewRequestReview = ReviewRequest["reviews"][number];
type ReviewsInboxItem = ReviewsRouterOutputs["inbox"]["items"][number];

export type ReviewDecision = "approved" | "changes_requested";

export interface InvalidatePostReviewQueriesInput {
  queryClient: QueryClient;
  organizationId: string;
  contentId: string;
}

export interface ReviewPostMutationInput {
  contentId: string;
  decision: ReviewDecision;
  comment?: string;
}

export interface UpdatePostStatusMutationInput {
  contentId: string;
  status: "draft" | "published";
}

export interface RequestChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: (comment: string) => void;
}

export interface ContentReviewControlsProps {
  organizationId: string;
  contentId: string;
  status: PostStatus;
}

export interface ContentReviewPanelProps {
  organizationId: string;
  contentId: string;
  status: PostStatus;
}

export interface ReviewCommentsProps {
  reviews: ReviewRequestReview[];
}

export interface ReviewStepsChainProps {
  steps: ReviewRequestStep[];
}

export interface ReviewsPageClientProps {
  organizationSlug: string;
}

export interface ReviewsInboxRowProps {
  item: ReviewsInboxItem;
  organizationId: string;
  organizationSlug: string;
}

export interface WorkflowStepWithAccessGroup {
  stepOrder: number;
  reviewerAccessGroupId: string;
  requiredApprovals: number;
  name: string | null;
  reviewerAccessGroup: {
    name: string;
  };
}

export interface WorkflowWithSteps {
  id: string;
  name: string;
  appliesToAccessGroupId: string | null;
  isDefault: boolean;
  steps: WorkflowStepWithAccessGroup[];
}
