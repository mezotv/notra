import { SCOPE_GROUPS } from "@notra/db/constants/permissions";
import { db } from "@notra/db/drizzle";
import {
  accessGroupMembers,
  accessGroups,
  approvalWorkflowSteps,
  approvalWorkflows,
  members,
} from "@notra/db/schema";
import type { OrganizationScope } from "@notra/db/types/access-groups";
import { filterOrganizationScopes } from "@notra/db/utils/permissions";
import { and, asc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authorizedProcedure } from "@/lib/orpc/base";
import { assertOrganizationScopes } from "@/lib/permissions/assert";
import { ensureSystemAccessGroups } from "@/lib/permissions/system-access-groups";
import {
  accessGroupInputSchema,
  accessGroupsListInputSchema,
  assignAccessGroupInputSchema,
  createAccessGroupInputSchema,
  updateAccessGroupInputSchema,
} from "@/schemas/access-groups";
import { conflict, forbidden, notFound } from "../utils/errors";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function assertNoScopeEscalation(
  callerScopes: OrganizationScope[],
  groupScopes: string[]
) {
  const held = new Set(callerScopes);
  const escalated = filterOrganizationScopes(groupScopes).filter(
    (scope) => !held.has(scope)
  );

  if (escalated.length > 0) {
    throw forbidden(
      `You cannot grant permissions you do not have: ${escalated.join(", ")}`
    );
  }
}

async function findAccessGroup(organizationId: string, accessGroupId: string) {
  const accessGroup = await db.query.accessGroups.findFirst({
    where: and(
      eq(accessGroups.id, accessGroupId),
      eq(accessGroups.organizationId, organizationId)
    ),
  });

  if (!accessGroup) {
    throw notFound("Access group not found");
  }

  return accessGroup;
}

export const accessGroupsRouter = {
  list: authorizedProcedure
    .input(accessGroupsListInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      await ensureSystemAccessGroups(input.organizationId);

      const groups = await db.query.accessGroups.findMany({
        where: eq(accessGroups.organizationId, input.organizationId),
        with: {
          memberships: {
            columns: {
              memberId: true,
            },
          },
        },
        orderBy: [asc(accessGroups.createdAt)],
      });

      return {
        scopeGroups: SCOPE_GROUPS,
        accessGroups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          scopes: filterOrganizationScopes(group.scopes),
          isSystem: group.systemKey !== null,
          memberCount: group.memberships.length,
          createdAt: group.createdAt.toISOString(),
        })),
      };
    }),

  me: authorizedProcedure
    .input(accessGroupsListInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const memberships = await db.query.accessGroupMembers.findMany({
        where: eq(accessGroupMembers.memberId, access.membership.id),
        with: {
          accessGroup: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        memberId: access.membership.id,
        memberRole: access.membership.role,
        scopes: access.scopes,
        accessGroups: memberships.map((membership) => ({
          id: membership.accessGroup.id,
          name: membership.accessGroup.name,
        })),
      };
    }),

  assignments: authorizedProcedure
    .input(accessGroupsListInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const organizationMembers = await db.query.members.findMany({
        where: eq(members.organizationId, input.organizationId),
        columns: {
          id: true,
        },
      });

      const memberIds = organizationMembers.map((member) => member.id);
      if (memberIds.length === 0) {
        return { assignments: [] };
      }

      const memberships = await db.query.accessGroupMembers.findMany({
        where: inArray(accessGroupMembers.memberId, memberIds),
        with: {
          accessGroup: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        assignments: memberships.map((membership) => ({
          memberId: membership.memberId,
          accessGroupId: membership.accessGroup.id,
          accessGroupName: membership.accessGroup.name,
        })),
      };
    }),

  create: authorizedProcedure
    .input(createAccessGroupInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["roles:manage"],
      });

      assertNoScopeEscalation(access.scopes, input.scopes);

      const id = nanoid();

      try {
        await db.insert(accessGroups).values({
          id,
          organizationId: input.organizationId,
          name: input.name,
          description: input.description ?? null,
          scopes: input.scopes,
          systemKey: null,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw conflict(
            `An access group named "${input.name}" already exists`
          );
        }
        throw error;
      }

      return { id };
    }),

  update: authorizedProcedure
    .input(updateAccessGroupInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["roles:manage"],
      });

      if (input.scopes !== undefined) {
        assertNoScopeEscalation(access.scopes, input.scopes);
      }

      const accessGroup = await findAccessGroup(
        input.organizationId,
        input.accessGroupId
      );

      if (accessGroup.systemKey !== null) {
        throw forbidden("System access groups cannot be edited");
      }

      try {
        await db
          .update(accessGroups)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.description !== undefined
              ? { description: input.description }
              : {}),
            ...(input.scopes !== undefined ? { scopes: input.scopes } : {}),
          })
          .where(eq(accessGroups.id, accessGroup.id));
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw conflict(
            `An access group named "${input.name}" already exists`
          );
        }
        throw error;
      }

      return { success: true as const };
    }),

  delete: authorizedProcedure
    .input(accessGroupInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["roles:manage"],
      });

      const accessGroup = await findAccessGroup(
        input.organizationId,
        input.accessGroupId
      );

      if (accessGroup.systemKey !== null) {
        throw forbidden("System access groups cannot be deleted");
      }

      const workflowUsingGroup = await db.query.approvalWorkflows.findFirst({
        where: and(
          eq(approvalWorkflows.organizationId, input.organizationId),
          eq(approvalWorkflows.appliesToAccessGroupId, accessGroup.id)
        ),
        columns: {
          id: true,
          name: true,
        },
      });

      const stepUsingGroup = workflowUsingGroup
        ? null
        : await db
            .select({
              id: approvalWorkflowSteps.id,
              workflowName: approvalWorkflows.name,
            })
            .from(approvalWorkflowSteps)
            .innerJoin(
              approvalWorkflows,
              eq(approvalWorkflowSteps.workflowId, approvalWorkflows.id)
            )
            .where(
              and(
                eq(approvalWorkflows.organizationId, input.organizationId),
                eq(approvalWorkflowSteps.reviewerAccessGroupId, accessGroup.id)
              )
            )
            .limit(1)
            .then((rows) => rows[0] ?? null);

      const blockingWorkflowName =
        workflowUsingGroup?.name ?? stepUsingGroup?.workflowName;
      if (blockingWorkflowName) {
        throw conflict(
          `This access group is used by the "${blockingWorkflowName}" approval workflow. Update the workflow first.`
        );
      }

      await db.delete(accessGroups).where(eq(accessGroups.id, accessGroup.id));

      return { success: true as const };
    }),

  assign: authorizedProcedure
    .input(assignAccessGroupInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["members:manage"],
      });

      const member = await db.query.members.findFirst({
        where: and(
          eq(members.id, input.memberId),
          eq(members.organizationId, input.organizationId)
        ),
        columns: {
          id: true,
        },
      });

      if (!member) {
        throw notFound("Member not found");
      }

      const accessGroup = await findAccessGroup(
        input.organizationId,
        input.accessGroupId
      );

      assertNoScopeEscalation(access.scopes, accessGroup.scopes);

      await db
        .insert(accessGroupMembers)
        .values({
          id: nanoid(),
          memberId: input.memberId,
          accessGroupId: input.accessGroupId,
        })
        .onConflictDoNothing();

      return { success: true as const };
    }),

  unassign: authorizedProcedure
    .input(assignAccessGroupInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["members:manage"],
      });

      const member = await db.query.members.findFirst({
        where: and(
          eq(members.id, input.memberId),
          eq(members.organizationId, input.organizationId)
        ),
        columns: {
          id: true,
        },
      });

      if (!member) {
        throw notFound("Member not found");
      }

      await db
        .delete(accessGroupMembers)
        .where(
          and(
            eq(accessGroupMembers.memberId, input.memberId),
            eq(accessGroupMembers.accessGroupId, input.accessGroupId)
          )
        );

      return { success: true as const };
    }),
};
