import type { createDb } from "@notra/db/drizzle";
import {
  approvalWorkflows,
  memberRoleAssignments,
  members,
  postApprovalRequests,
} from "@notra/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { Data, Effect } from "effect";

type Database = ReturnType<typeof createDb>;

class PublishRequirementError extends Data.TaggedError(
  "PublishRequirementError"
)<{
  readonly message: string;
}> {}

class PublishCheckError extends Data.TaggedError("PublishCheckError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

const tryDb = <T>(run: () => Promise<T>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) =>
      new PublishCheckError({
        message: "Failed to check publishing requirements",
        cause,
      }),
  });

const getAuthorRoleIds = Effect.fn("getAuthorRoleIds")(function* ({
  db,
  organizationId,
  authorUserId,
}: {
  db: Database;
  organizationId: string;
  authorUserId: string | null;
}) {
  if (!authorUserId) {
    return [] as string[];
  }

  const membership = yield* tryDb(() =>
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

  if (!membership) {
    return [] as string[];
  }

  const assignments = yield* tryDb(() =>
    db.query.memberRoleAssignments.findMany({
      where: eq(memberRoleAssignments.memberId, membership.id),
      columns: {
        roleId: true,
      },
    })
  );

  return assignments.map((assignment) => assignment.roleId);
});

export const cancelPendingApiApprovalRequests = Effect.fn(
  "cancelPendingApiApprovalRequests"
)(function* ({
  db,
  organizationId,
  postId,
}: {
  db: Database;
  organizationId: string;
  postId: string;
}) {
  yield* tryDb(() =>
    db
      .update(postApprovalRequests)
      .set({ status: "canceled", resolvedAt: new Date() })
      .where(
        and(
          eq(postApprovalRequests.postId, postId),
          eq(postApprovalRequests.organizationId, organizationId),
          eq(postApprovalRequests.status, "pending")
        )
      )
  );
});

export const assertApiPublishAllowed = Effect.fn("assertApiPublishAllowed")(
  function* ({
    db,
    organizationId,
    post,
  }: {
    db: Database;
    organizationId: string;
    post: {
      status: "draft" | "in_review" | "approved" | "published";
      createdBy: string | null;
    };
  }) {
    if (post.status === "approved" || post.status === "published") {
      return;
    }

    const authorRoleIds = yield* getAuthorRoleIds({
      db,
      organizationId,
      authorUserId: post.createdBy,
    });

    const workflows = yield* tryDb(() =>
      db.query.approvalWorkflows.findMany({
        where: eq(approvalWorkflows.organizationId, organizationId),
        with: {
          steps: {
            columns: {
              id: true,
            },
          },
        },
        orderBy: [asc(approvalWorkflows.createdAt)],
      })
    );

    const withSteps = workflows.filter((workflow) => workflow.steps.length > 0);
    const applicable =
      withSteps.find(
        (workflow) =>
          workflow.appliesToRoleId &&
          authorRoleIds.includes(workflow.appliesToRoleId)
      ) ?? withSteps.find((workflow) => workflow.isDefault);

    if (applicable) {
      return yield* Effect.fail(
        new PublishRequirementError({
          message: `This post must be approved through the "${applicable.name}" workflow before it can be published`,
        })
      );
    }
  }
);
