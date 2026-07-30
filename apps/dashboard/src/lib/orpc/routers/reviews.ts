import { db } from "@notra/db/drizzle";
import {
  accessGroups,
  approvalWorkflowSteps,
  approvalWorkflows,
  postApprovalRequests,
  posts,
} from "@notra/db/schema";
import type { ApprovalWorkflowStepSnapshot } from "@notra/db/types/access-groups";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { Effect } from "effect";
import { nanoid } from "nanoid";
import { authorizedProcedure } from "@/lib/orpc/base";
import { assertOrganizationScopes } from "@/lib/permissions/assert";
import { resolveMemberAccessGroupIds } from "@/lib/permissions/resolve-scopes";
import { toReviewOrpcError } from "@/lib/reviews/map-errors";
import {
  findApplicableWorkflow,
  getAuthorAccessGroupIds,
  reviewPost,
  submitPostForReview,
} from "@/lib/reviews/workflow";
import {
  createWorkflowInputSchema,
  reviewPostInputSchema,
  reviewStateInputSchema,
  reviewsInboxInputSchema,
  submitForReviewInputSchema,
  updateWorkflowInputSchema,
  workflowInputSchema,
  workflowsListInputSchema,
} from "@/schemas/reviews";
import type { ScopedOrganizationContext } from "@/types/permissions";
import { badRequest, conflict, notFound } from "../utils/errors";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function resolveAccessGroupIds(memberId: string) {
  return await Effect.runPromise(
    resolveMemberAccessGroupIds({ memberId }).pipe(
      Effect.mapError(toReviewOrpcError)
    )
  );
}

function isWorkspaceAdmin(memberRole: string) {
  return memberRole === "owner" || memberRole === "admin";
}

function serializeStepProgress(
  steps: ApprovalWorkflowStepSnapshot[],
  currentStepOrder: number,
  reviews: { stepOrder: number; decision: string }[],
  requestStatus: string
) {
  const ordered = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return ordered.map((step) => {
    const approvals = reviews.filter(
      (review) =>
        review.stepOrder === step.stepOrder && review.decision === "approved"
    ).length;

    const isComplete =
      requestStatus === "approved" ||
      step.stepOrder < currentStepOrder ||
      approvals >= step.requiredApprovals;

    return {
      stepOrder: step.stepOrder,
      name: step.name,
      reviewerAccessGroupName: step.reviewerAccessGroupName,
      reviewerAccessGroupId: step.reviewerAccessGroupId,
      requiredApprovals: step.requiredApprovals,
      approvals,
      isCurrent:
        requestStatus === "pending" && step.stepOrder === currentStepOrder,
      isComplete,
    };
  });
}

async function assertWorkflowGroupsBelongToOrganization(
  organizationId: string,
  accessGroupIds: string[]
) {
  if (accessGroupIds.length === 0) {
    return;
  }

  const groups = await db.query.accessGroups.findMany({
    where: and(
      eq(accessGroups.organizationId, organizationId),
      inArray(accessGroups.id, accessGroupIds)
    ),
    columns: {
      id: true,
    },
  });

  const found = new Set(groups.map((group) => group.id));
  const missing = accessGroupIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw badRequest(
      "One or more access groups do not belong to this workspace"
    );
  }
}

async function replaceWorkflowSteps(
  workflowId: string,
  steps: {
    reviewerAccessGroupId: string;
    requiredApprovals: number;
    name?: string | null;
  }[]
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(approvalWorkflowSteps)
      .where(eq(approvalWorkflowSteps.workflowId, workflowId));

    await tx.insert(approvalWorkflowSteps).values(
      steps.map((step, index) => ({
        id: nanoid(),
        workflowId,
        stepOrder: index + 1,
        reviewerAccessGroupId: step.reviewerAccessGroupId,
        requiredApprovals: step.requiredApprovals,
        name: step.name ?? null,
      }))
    );
  });
}

async function clearDefaultWorkflow(organizationId: string, exceptId?: string) {
  const where = exceptId
    ? and(
        eq(approvalWorkflows.organizationId, organizationId),
        eq(approvalWorkflows.isDefault, true),
        ne(approvalWorkflows.id, exceptId)
      )
    : and(
        eq(approvalWorkflows.organizationId, organizationId),
        eq(approvalWorkflows.isDefault, true)
      );

  await db.update(approvalWorkflows).set({ isDefault: false }).where(where);
}

async function getPendingRequest(organizationId: string, contentId: string) {
  return await db.query.postApprovalRequests.findFirst({
    where: and(
      eq(postApprovalRequests.postId, contentId),
      eq(postApprovalRequests.organizationId, organizationId),
      eq(postApprovalRequests.status, "pending")
    ),
    with: {
      reviews: {
        with: {
          reviewer: {
            columns: {
              name: true,
            },
          },
        },
      },
      requestedByUser: {
        columns: {
          name: true,
        },
      },
      workflow: {
        columns: {
          name: true,
        },
      },
    },
  });
}

async function buildPublishability(
  access: ScopedOrganizationContext,
  post: { status: string; createdBy: string | null }
) {
  const canPublishOverride = access.scopes.includes("posts:publish_override");
  const hasPublishScope = access.scopes.includes("posts:publish");

  const authorAccessGroupIds = await Effect.runPromise(
    (post.createdBy
      ? getAuthorAccessGroupIds({
          organizationId: access.organizationId,
          authorUserId: post.createdBy,
        })
      : Effect.succeed([] as string[])
    ).pipe(Effect.mapError(toReviewOrpcError))
  );

  const authorWorkflow = await Effect.runPromise(
    findApplicableWorkflow({
      organizationId: access.organizationId,
      authorAccessGroupIds,
    }).pipe(Effect.mapError(toReviewOrpcError))
  );

  const requiresApproval =
    authorWorkflow !== null &&
    post.status !== "approved" &&
    post.status !== "published";

  return {
    canPublishOverride,
    requiresApproval,
    canPublish: canPublishOverride || (hasPublishScope && !requiresApproval),
  };
}

export const reviewsRouter = {
  submit: authorizedProcedure
    .input(submitForReviewInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        anyOfScopes: ["posts:create", "posts:edit"],
      });

      const result = await Effect.runPromise(
        submitPostForReview({
          postId: input.contentId,
          organizationId: input.organizationId,
          userId: access.user.id,
          memberId: access.membership.id,
        }).pipe(Effect.mapError(toReviewOrpcError))
      );

      return {
        success: true as const,
        requestId: result.requestId,
        workflowName: result.workflowName,
      };
    }),

  review: authorizedProcedure
    .input(reviewPostInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["posts:review"],
      });

      const result = await Effect.runPromise(
        reviewPost({
          postId: input.contentId,
          organizationId: input.organizationId,
          reviewerUserId: access.user.id,
          reviewerMemberId: access.membership.id,
          reviewerMemberRole: access.membership.role,
          decision: input.decision,
          comment: input.comment,
        }).pipe(Effect.mapError(toReviewOrpcError))
      );

      return { success: true as const, outcome: result.outcome };
    }),

  state: authorizedProcedure
    .input(reviewStateInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const post = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, input.contentId),
          eq(posts.organizationId, input.organizationId)
        ),
        columns: {
          id: true,
          status: true,
          createdBy: true,
        },
      });

      if (!post) {
        throw notFound("Content not found");
      }

      const [
        myAccessGroupIds,
        pendingRequest,
        latestResolvedRequest,
        publishability,
      ] = await Promise.all([
        resolveAccessGroupIds(access.membership.id),
        getPendingRequest(input.organizationId, input.contentId),
        db.query.postApprovalRequests.findFirst({
          where: and(
            eq(postApprovalRequests.postId, input.contentId),
            eq(postApprovalRequests.organizationId, input.organizationId),
            ne(postApprovalRequests.status, "pending")
          ),
          orderBy: [desc(postApprovalRequests.createdAt)],
          with: {
            reviews: {
              with: {
                reviewer: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
        buildPublishability(access, post),
      ]);

      const myWorkflow = await Effect.runPromise(
        findApplicableWorkflow({
          organizationId: input.organizationId,
          authorAccessGroupIds: myAccessGroupIds,
        }).pipe(Effect.mapError(toReviewOrpcError))
      );

      const serializeRequest = (
        request: NonNullable<typeof latestResolvedRequest> & {
          requestedByUser?: { name: string } | null;
          workflow?: { name: string } | null;
        }
      ) => ({
        id: request.id,
        status: request.status,
        currentStepOrder: request.currentStepOrder,
        requestedBy: request.requestedBy,
        requestedByName: request.requestedByUser?.name ?? null,
        workflowName: request.workflow?.name ?? null,
        createdAt: request.createdAt.toISOString(),
        resolvedAt: request.resolvedAt?.toISOString() ?? null,
        steps: serializeStepProgress(
          request.steps,
          request.currentStepOrder,
          request.reviews,
          request.status
        ),
        reviews: request.reviews.map((review) => ({
          id: review.id,
          stepOrder: review.stepOrder,
          reviewerId: review.reviewerId,
          reviewerName: review.reviewer.name,
          decision: review.decision,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
        })),
      });

      const currentStep = pendingRequest
        ? pendingRequest.steps.find(
            (step) => step.stepOrder === pendingRequest.currentStepOrder
          )
        : undefined;

      const alreadyReviewedCurrentStep = Boolean(
        pendingRequest?.reviews.some(
          (review) =>
            review.stepOrder === pendingRequest.currentStepOrder &&
            review.reviewerId === access.user.id
        )
      );

      const canReview = Boolean(
        pendingRequest &&
          currentStep &&
          access.scopes.includes("posts:review") &&
          pendingRequest.requestedBy !== access.user.id &&
          !alreadyReviewedCurrentStep &&
          (isWorkspaceAdmin(access.membership.role) ||
            myAccessGroupIds.includes(currentStep.reviewerAccessGroupId))
      );

      return {
        status: post.status,
        request: pendingRequest ? serializeRequest(pendingRequest) : null,
        lastRequest:
          !pendingRequest && latestResolvedRequest
            ? serializeRequest(latestResolvedRequest)
            : null,
        canReview,
        canSubmit: post.status === "draft" && myWorkflow !== null,
        requiresApproval: publishability.requiresApproval,
        canPublish: publishability.canPublish,
        canPublishOverride: publishability.canPublishOverride,
      };
    }),

  inbox: authorizedProcedure
    .input(reviewsInboxInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["posts:review"],
      });

      const [myAccessGroupIds, requests] = await Promise.all([
        resolveAccessGroupIds(access.membership.id),
        db.query.postApprovalRequests.findMany({
          where: and(
            eq(postApprovalRequests.organizationId, input.organizationId),
            eq(postApprovalRequests.status, "pending")
          ),
          with: {
            post: {
              columns: {
                id: true,
                title: true,
                contentType: true,
              },
            },
            requestedByUser: {
              columns: {
                name: true,
              },
            },
            workflow: {
              columns: {
                name: true,
              },
            },
            reviews: {
              columns: {
                stepOrder: true,
                decision: true,
                reviewerId: true,
              },
            },
          },
          orderBy: [asc(postApprovalRequests.createdAt)],
        }),
      ]);

      const admin = isWorkspaceAdmin(access.membership.role);
      const myAccessGroupIdSet = new Set(myAccessGroupIds);

      const items = requests.flatMap((request) => {
        const currentStep = request.steps.find(
          (step) => step.stepOrder === request.currentStepOrder
        );

        if (!currentStep) {
          return [];
        }

        if (request.requestedBy === access.user.id) {
          return [];
        }

        if (
          !(admin || myAccessGroupIdSet.has(currentStep.reviewerAccessGroupId))
        ) {
          return [];
        }

        const alreadyReviewed = request.reviews.some(
          (review) =>
            review.stepOrder === request.currentStepOrder &&
            review.reviewerId === access.user.id
        );

        if (alreadyReviewed) {
          return [];
        }

        const approvals = request.reviews.filter(
          (review) =>
            review.stepOrder === request.currentStepOrder &&
            review.decision === "approved"
        ).length;

        return [
          {
            requestId: request.id,
            contentId: request.post.id,
            title: request.post.title,
            contentType: request.post.contentType,
            workflowName: request.workflow?.name ?? null,
            requestedByName: request.requestedByUser.name,
            requestedAt: request.createdAt.toISOString(),
            stepOrder: currentStep.stepOrder,
            stepName: currentStep.name,
            reviewerAccessGroupName: currentStep.reviewerAccessGroupName,
            approvals,
            requiredApprovals: currentStep.requiredApprovals,
            totalSteps: request.steps.length,
          },
        ];
      });

      return { items };
    }),

  workflows: {
    list: authorizedProcedure
      .input(workflowsListInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationScopes({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        const workflows = await db.query.approvalWorkflows.findMany({
          where: eq(approvalWorkflows.organizationId, input.organizationId),
          with: {
            steps: {
              orderBy: (steps, { asc: ascending }) => [
                ascending(steps.stepOrder),
              ],
              with: {
                reviewerAccessGroup: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            appliesToAccessGroup: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [asc(approvalWorkflows.createdAt)],
        });

        return {
          workflows: workflows.map((workflow) => ({
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            isDefault: workflow.isDefault,
            appliesToAccessGroup: workflow.appliesToAccessGroup
              ? {
                  id: workflow.appliesToAccessGroup.id,
                  name: workflow.appliesToAccessGroup.name,
                }
              : null,
            steps: workflow.steps.map((step) => ({
              id: step.id,
              stepOrder: step.stepOrder,
              name: step.name,
              requiredApprovals: step.requiredApprovals,
              reviewerAccessGroup: {
                id: step.reviewerAccessGroup.id,
                name: step.reviewerAccessGroup.name,
              },
            })),
            createdAt: workflow.createdAt.toISOString(),
          })),
        };
      }),

    create: authorizedProcedure
      .input(createWorkflowInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationScopes({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
          scopes: ["publishing:manage"],
        });

        await assertWorkflowGroupsBelongToOrganization(input.organizationId, [
          ...new Set([
            ...input.steps.map((step) => step.reviewerAccessGroupId),
            ...(input.appliesToAccessGroupId
              ? [input.appliesToAccessGroupId]
              : []),
          ]),
        ]);

        const workflowId = nanoid();

        try {
          await db.transaction(async (tx) => {
            if (input.isDefault) {
              await tx
                .update(approvalWorkflows)
                .set({ isDefault: false })
                .where(
                  and(
                    eq(approvalWorkflows.organizationId, input.organizationId),
                    eq(approvalWorkflows.isDefault, true)
                  )
                );
            }

            await tx.insert(approvalWorkflows).values({
              id: workflowId,
              organizationId: input.organizationId,
              name: input.name,
              description: input.description ?? null,
              appliesToAccessGroupId: input.appliesToAccessGroupId ?? null,
              isDefault: input.isDefault ?? false,
            });

            await tx.insert(approvalWorkflowSteps).values(
              input.steps.map((step, index) => ({
                id: nanoid(),
                workflowId,
                stepOrder: index + 1,
                reviewerAccessGroupId: step.reviewerAccessGroupId,
                requiredApprovals: step.requiredApprovals,
                name: step.name ?? null,
              }))
            );
          });
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw conflict(
              "An approval workflow already applies to this access group"
            );
          }
          throw error;
        }

        return { id: workflowId };
      }),

    update: authorizedProcedure
      .input(updateWorkflowInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationScopes({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
          scopes: ["publishing:manage"],
        });

        const workflow = await db.query.approvalWorkflows.findFirst({
          where: and(
            eq(approvalWorkflows.id, input.workflowId),
            eq(approvalWorkflows.organizationId, input.organizationId)
          ),
          columns: {
            id: true,
          },
        });

        if (!workflow) {
          throw notFound("Workflow not found");
        }

        await assertWorkflowGroupsBelongToOrganization(input.organizationId, [
          ...new Set([
            ...(input.steps?.map((step) => step.reviewerAccessGroupId) ?? []),
            ...(input.appliesToAccessGroupId
              ? [input.appliesToAccessGroupId]
              : []),
          ]),
        ]);

        try {
          if (input.isDefault) {
            await clearDefaultWorkflow(input.organizationId, workflow.id);
          }

          await db
            .update(approvalWorkflows)
            .set({
              ...(input.name !== undefined ? { name: input.name } : {}),
              ...(input.description !== undefined
                ? { description: input.description }
                : {}),
              ...(input.appliesToAccessGroupId !== undefined
                ? { appliesToAccessGroupId: input.appliesToAccessGroupId }
                : {}),
              ...(input.isDefault !== undefined
                ? { isDefault: input.isDefault }
                : {}),
            })
            .where(eq(approvalWorkflows.id, workflow.id));

          if (input.steps) {
            await replaceWorkflowSteps(workflow.id, input.steps);
          }
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw conflict(
              "An approval workflow already applies to this access group"
            );
          }
          throw error;
        }

        return { success: true as const };
      }),

    delete: authorizedProcedure
      .input(workflowInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationScopes({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
          scopes: ["publishing:manage"],
        });

        const workflow = await db.query.approvalWorkflows.findFirst({
          where: and(
            eq(approvalWorkflows.id, input.workflowId),
            eq(approvalWorkflows.organizationId, input.organizationId)
          ),
          columns: {
            id: true,
          },
        });

        if (!workflow) {
          throw notFound("Workflow not found");
        }

        await db
          .delete(approvalWorkflows)
          .where(eq(approvalWorkflows.id, workflow.id));

        return { success: true as const };
      }),
  },
};
