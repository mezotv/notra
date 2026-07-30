import { db } from "@notra/db/drizzle";
import {
  approvalWorkflows,
  members,
  postApprovalRequests,
  postReviews,
  posts,
} from "@notra/db/schema";
import type {
  ApprovalWorkflowStepSnapshot,
  OrganizationScope,
} from "@notra/db/types/roles";
import { and, asc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { nanoid } from "nanoid";
import { retryTransientDbError } from "@/lib/db/retry";
import { resolveMemberRoleIds } from "@/lib/permissions/resolve-scopes";
import {
  PublishBlockedError,
  ReviewPermissionError,
  ReviewPersistenceError,
  ReviewStateError,
} from "@/lib/reviews/errors";
import type { WorkflowWithSteps } from "@/types/reviews";

const tryDb = <T>(run: () => Promise<T>) =>
  Effect.tryPromise({
    try: () => retryTransientDbError(run),
    catch: (cause) =>
      new ReviewPersistenceError({
        message: "Failed to run review workflow query",
        cause,
      }),
  });

export const findApplicableWorkflow = Effect.fn("findApplicableWorkflow")(
  function* ({
    organizationId,
    authorRoleIds,
  }: {
    organizationId: string;
    authorRoleIds: string[];
  }) {
    const workflows = yield* tryDb(() =>
      db.query.approvalWorkflows.findMany({
        where: eq(approvalWorkflows.organizationId, organizationId),
        with: {
          steps: {
            orderBy: (steps, { asc: ascending }) => [
              ascending(steps.stepOrder),
            ],
            with: {
              reviewerRole: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [asc(approvalWorkflows.createdAt)],
      })
    );

    const authorRoleIdSet = new Set(authorRoleIds);
    const withSteps = workflows.filter((workflow) => workflow.steps.length > 0);
    const roleMatch = withSteps.find(
      (workflow) =>
        workflow.appliesToRoleId &&
        authorRoleIdSet.has(workflow.appliesToRoleId)
    );

    return (
      roleMatch ?? withSteps.find((workflow) => workflow.isDefault) ?? null
    );
  }
);

const snapshotSteps = (
  workflow: WorkflowWithSteps
): ApprovalWorkflowStepSnapshot[] =>
  workflow.steps.map((step) => ({
    stepOrder: step.stepOrder,
    reviewerRoleId: step.reviewerRoleId,
    reviewerRoleName: step.reviewerRole.name,
    requiredApprovals: step.requiredApprovals,
    name: step.name,
  }));

export const submitPostForReview = Effect.fn("submitPostForReview")(function* ({
  postId,
  organizationId,
  userId,
  memberId,
}: {
  postId: string;
  organizationId: string;
  userId: string;
  memberId: string;
}) {
  const post = yield* tryDb(() =>
    db.query.posts.findFirst({
      where: and(
        eq(posts.id, postId),
        eq(posts.organizationId, organizationId)
      ),
      columns: {
        id: true,
        status: true,
      },
    })
  );

  if (!post) {
    return yield* Effect.fail(
      new ReviewStateError({ message: "Content not found" })
    );
  }

  if (post.status !== "draft") {
    return yield* Effect.fail(
      new ReviewStateError({
        message: "Only drafts can be submitted for review",
      })
    );
  }

  const authorRoleIds = yield* resolveMemberRoleIds({ memberId }).pipe(
    Effect.mapError(
      (cause) =>
        new ReviewPersistenceError({
          message: "Failed to resolve author roles",
          cause,
        })
    )
  );

  const workflow = yield* findApplicableWorkflow({
    organizationId,
    authorRoleIds,
  });

  if (!workflow) {
    return yield* Effect.fail(
      new ReviewStateError({
        message:
          "No approval workflow applies to you. You can publish directly if you have the publish permission.",
      })
    );
  }

  const steps = snapshotSteps(workflow);
  const firstStep = steps[0];
  if (!firstStep) {
    return yield* Effect.fail(
      new ReviewStateError({
        message: "The applicable approval workflow has no steps",
      })
    );
  }

  const requestId = nanoid();

  yield* Effect.tryPromise({
    try: () =>
      retryTransientDbError(() =>
        db.transaction(async (tx) => {
          await tx.insert(postApprovalRequests).values({
            id: requestId,
            postId,
            organizationId,
            workflowId: workflow.id,
            steps,
            currentStepOrder: firstStep.stepOrder,
            status: "pending",
            requestedBy: userId,
          });

          await tx
            .update(posts)
            .set({ status: "in_review", updatedAt: new Date() })
            .where(
              and(
                eq(posts.id, postId),
                eq(posts.organizationId, organizationId)
              )
            );
        })
      ),
    catch: (cause) => {
      if (
        typeof cause === "object" &&
        cause !== null &&
        "code" in cause &&
        cause.code === "23505"
      ) {
        return new ReviewStateError({
          message: "This post is already in review",
        });
      }

      return new ReviewPersistenceError({
        message: "Failed to submit post for review",
        cause,
      });
    },
  });

  return { requestId, workflowName: workflow.name, steps };
});

const findCurrentStep = (
  steps: ApprovalWorkflowStepSnapshot[],
  currentStepOrder: number
) => steps.find((step) => step.stepOrder === currentStepOrder);

const findNextStep = (
  steps: ApprovalWorkflowStepSnapshot[],
  currentStepOrder: number
) =>
  [...steps]
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .find((step) => step.stepOrder > currentStepOrder);

export const reviewPost = Effect.fn("reviewPost")(function* ({
  postId,
  organizationId,
  reviewerUserId,
  reviewerMemberId,
  reviewerMemberRole,
  decision,
  comment,
}: {
  postId: string;
  organizationId: string;
  reviewerUserId: string;
  reviewerMemberId: string;
  reviewerMemberRole: string;
  decision: "approved" | "changes_requested";
  comment?: string;
}) {
  const request = yield* tryDb(() =>
    db.query.postApprovalRequests.findFirst({
      where: and(
        eq(postApprovalRequests.postId, postId),
        eq(postApprovalRequests.organizationId, organizationId),
        eq(postApprovalRequests.status, "pending")
      ),
    })
  );

  if (!request) {
    return yield* Effect.fail(
      new ReviewStateError({
        message: "This post has no pending review request",
      })
    );
  }

  if (request.requestedBy === reviewerUserId) {
    return yield* Effect.fail(
      new ReviewPermissionError({
        message: "You cannot review a post you submitted for review",
      })
    );
  }

  const currentStep = findCurrentStep(request.steps, request.currentStepOrder);
  if (!currentStep) {
    return yield* Effect.fail(
      new ReviewStateError({
        message: "The review request references an unknown step",
      })
    );
  }

  const reviewerRoleIds = yield* resolveMemberRoleIds({
    memberId: reviewerMemberId,
  }).pipe(
    Effect.mapError(
      (cause) =>
        new ReviewPersistenceError({
          message: "Failed to resolve reviewer roles",
          cause,
        })
    )
  );

  const isWorkspaceAdmin =
    reviewerMemberRole === "owner" || reviewerMemberRole === "admin";
  if (
    !(isWorkspaceAdmin || reviewerRoleIds.includes(currentStep.reviewerRoleId))
  ) {
    return yield* Effect.fail(
      new ReviewPermissionError({
        message: `This step requires a review from the ${currentStep.reviewerRoleName} role`,
      })
    );
  }

  const existingReview = yield* tryDb(() =>
    db.query.postReviews.findFirst({
      where: and(
        eq(postReviews.requestId, request.id),
        eq(postReviews.stepOrder, request.currentStepOrder),
        eq(postReviews.reviewerId, reviewerUserId)
      ),
      columns: {
        id: true,
      },
    })
  );

  if (existingReview) {
    return yield* Effect.fail(
      new ReviewStateError({
        message: "You already reviewed this step",
      })
    );
  }

  const reviewId = nanoid();

  const result = yield* tryDb(() =>
    db.transaction(async (tx) => {
      const [locked] = await tx
        .select({
          status: postApprovalRequests.status,
          currentStepOrder: postApprovalRequests.currentStepOrder,
        })
        .from(postApprovalRequests)
        .where(eq(postApprovalRequests.id, request.id))
        .for("update");

      if (
        !locked ||
        locked.status !== "pending" ||
        locked.currentStepOrder !== request.currentStepOrder
      ) {
        return { outcome: "stale" as const };
      }

      await tx.insert(postReviews).values({
        id: reviewId,
        requestId: request.id,
        postId,
        stepOrder: request.currentStepOrder,
        reviewerId: reviewerUserId,
        decision,
        comment: comment ?? null,
      });

      if (decision === "changes_requested") {
        await tx
          .update(postApprovalRequests)
          .set({ status: "rejected", resolvedAt: new Date() })
          .where(eq(postApprovalRequests.id, request.id));

        await tx
          .update(posts)
          .set({ status: "draft", updatedAt: new Date() })
          .where(eq(posts.id, postId));

        return { outcome: "changes_requested" as const };
      }

      const approvalsForStep = await tx.query.postReviews.findMany({
        where: and(
          eq(postReviews.requestId, request.id),
          eq(postReviews.stepOrder, request.currentStepOrder),
          eq(postReviews.decision, "approved")
        ),
        columns: {
          id: true,
        },
      });

      if (approvalsForStep.length < currentStep.requiredApprovals) {
        return { outcome: "approved_waiting" as const };
      }

      const nextStep = findNextStep(request.steps, request.currentStepOrder);

      if (nextStep) {
        await tx
          .update(postApprovalRequests)
          .set({ currentStepOrder: nextStep.stepOrder })
          .where(eq(postApprovalRequests.id, request.id));

        return {
          outcome: "advanced" as const,
          nextStepOrder: nextStep.stepOrder,
        };
      }

      await tx
        .update(postApprovalRequests)
        .set({ status: "approved", resolvedAt: new Date() })
        .where(eq(postApprovalRequests.id, request.id));

      await tx
        .update(posts)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(posts.id, postId));

      return { outcome: "fully_approved" as const };
    })
  );

  if (result.outcome === "stale") {
    return yield* Effect.fail(
      new ReviewStateError({
        message: "This review request just changed. Refresh and try again.",
      })
    );
  }

  return result;
});

export const assertPublishAllowed = Effect.fn("assertPublishAllowed")(
  function* ({
    postId,
    organizationId,
    scopes,
  }: {
    postId: string;
    organizationId: string;
    scopes: OrganizationScope[];
  }) {
    if (scopes.includes("posts:publish_override")) {
      return;
    }

    if (!scopes.includes("posts:publish")) {
      return yield* Effect.fail(
        new PublishBlockedError({
          message: "You do not have permission to publish posts",
        })
      );
    }

    const post = yield* tryDb(() =>
      db.query.posts.findFirst({
        where: and(
          eq(posts.id, postId),
          eq(posts.organizationId, organizationId)
        ),
        columns: {
          status: true,
          createdBy: true,
        },
      })
    );

    if (!post) {
      return yield* Effect.fail(
        new ReviewStateError({ message: "Content not found" })
      );
    }

    if (post.status === "approved" || post.status === "published") {
      return;
    }

    const authorRoleIds = post.createdBy
      ? yield* getAuthorRoleIds({
          organizationId,
          authorUserId: post.createdBy,
        })
      : [];

    const workflow = yield* findApplicableWorkflow({
      organizationId,
      authorRoleIds,
    });

    if (workflow) {
      return yield* Effect.fail(
        new PublishBlockedError({
          message: `This post must be approved through the "${workflow.name}" workflow before it can be published`,
        })
      );
    }
  }
);

export const getAuthorRoleIds = Effect.fn("getAuthorRoleIds")(function* ({
  organizationId,
  authorUserId,
}: {
  organizationId: string;
  authorUserId: string;
}) {
  const authorMembership = yield* tryDb(() =>
    db.query.members.findFirst({
      where: and(
        eq(members.userId, authorUserId),
        eq(members.organizationId, organizationId)
      ),
      columns: {
        id: true,
      },
    })
  );

  if (!authorMembership) {
    return [];
  }

  return yield* resolveMemberRoleIds({ memberId: authorMembership.id }).pipe(
    Effect.mapError(
      (cause) =>
        new ReviewPersistenceError({
          message: "Failed to resolve author roles",
          cause,
        })
    )
  );
});
