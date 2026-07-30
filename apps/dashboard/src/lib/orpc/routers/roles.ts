import { SCOPE_GROUPS } from "@notra/db/constants/permissions";
import { db } from "@notra/db/drizzle";
import {
  approvalWorkflowSteps,
  approvalWorkflows,
  memberRoleAssignments,
  members,
  organizationRoles,
} from "@notra/db/schema";
import { filterOrganizationScopes } from "@notra/db/utils/permissions";
import { and, asc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authorizedProcedure } from "@/lib/orpc/base";
import { assertOrganizationScopes } from "@/lib/permissions/assert";
import { ensureSystemRoles } from "@/lib/permissions/system-roles";
import {
  assignRoleInputSchema,
  createRoleInputSchema,
  roleInputSchema,
  rolesListInputSchema,
  updateRoleInputSchema,
} from "@/schemas/roles";
import { conflict, forbidden, notFound } from "../utils/errors";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function findRole(organizationId: string, roleId: string) {
  const role = await db.query.organizationRoles.findFirst({
    where: and(
      eq(organizationRoles.id, roleId),
      eq(organizationRoles.organizationId, organizationId)
    ),
  });

  if (!role) {
    throw notFound("Role not found");
  }

  return role;
}

export const rolesRouter = {
  list: authorizedProcedure
    .input(rolesListInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      await ensureSystemRoles(input.organizationId);

      const roles = await db.query.organizationRoles.findMany({
        where: eq(organizationRoles.organizationId, input.organizationId),
        with: {
          memberAssignments: {
            columns: {
              memberId: true,
            },
          },
        },
        orderBy: [asc(organizationRoles.createdAt)],
      });

      return {
        scopeGroups: SCOPE_GROUPS,
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          scopes: filterOrganizationScopes(role.scopes),
          isSystem: role.systemKey !== null,
          memberCount: role.memberAssignments.length,
          createdAt: role.createdAt.toISOString(),
        })),
      };
    }),

  me: authorizedProcedure
    .input(rolesListInputSchema)
    .handler(async ({ context, input }) => {
      const access = await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const assignments = await db.query.memberRoleAssignments.findMany({
        where: eq(memberRoleAssignments.memberId, access.membership.id),
        with: {
          role: {
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
        roles: assignments.map((assignment) => ({
          id: assignment.role.id,
          name: assignment.role.name,
        })),
      };
    }),

  assignments: authorizedProcedure
    .input(rolesListInputSchema)
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

      const assignments = await db.query.memberRoleAssignments.findMany({
        where: inArray(memberRoleAssignments.memberId, memberIds),
        with: {
          role: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        assignments: assignments.map((assignment) => ({
          memberId: assignment.memberId,
          roleId: assignment.role.id,
          roleName: assignment.role.name,
        })),
      };
    }),

  create: authorizedProcedure
    .input(createRoleInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["roles:manage"],
      });

      const id = nanoid();

      try {
        await db.insert(organizationRoles).values({
          id,
          organizationId: input.organizationId,
          name: input.name,
          description: input.description ?? null,
          scopes: input.scopes,
          systemKey: null,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw conflict(`A role named "${input.name}" already exists`);
        }
        throw error;
      }

      return { id };
    }),

  update: authorizedProcedure
    .input(updateRoleInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["roles:manage"],
      });

      const role = await findRole(input.organizationId, input.roleId);

      if (role.systemKey !== null) {
        throw forbidden("System roles cannot be edited");
      }

      try {
        await db
          .update(organizationRoles)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.description !== undefined
              ? { description: input.description }
              : {}),
            ...(input.scopes !== undefined ? { scopes: input.scopes } : {}),
          })
          .where(eq(organizationRoles.id, role.id));
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw conflict(`A role named "${input.name}" already exists`);
        }
        throw error;
      }

      return { success: true as const };
    }),

  delete: authorizedProcedure
    .input(roleInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationScopes({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
        scopes: ["roles:manage"],
      });

      const role = await findRole(input.organizationId, input.roleId);

      if (role.systemKey !== null) {
        throw forbidden("System roles cannot be deleted");
      }

      const workflowUsingRole = await db.query.approvalWorkflows.findFirst({
        where: and(
          eq(approvalWorkflows.organizationId, input.organizationId),
          eq(approvalWorkflows.appliesToRoleId, role.id)
        ),
        columns: {
          id: true,
          name: true,
        },
      });

      const stepUsingRole = workflowUsingRole
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
                eq(approvalWorkflowSteps.reviewerRoleId, role.id)
              )
            )
            .limit(1)
            .then((rows) => rows[0] ?? null);

      const blockingWorkflowName =
        workflowUsingRole?.name ?? stepUsingRole?.workflowName;
      if (blockingWorkflowName) {
        throw conflict(
          `This role is used by the "${blockingWorkflowName}" approval workflow. Update the workflow first.`
        );
      }

      await db
        .delete(organizationRoles)
        .where(eq(organizationRoles.id, role.id));

      return { success: true as const };
    }),

  assign: authorizedProcedure
    .input(assignRoleInputSchema)
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

      const role = await findRole(input.organizationId, input.roleId);

      const callerScopes = new Set(access.scopes);
      const escalatedScopes = filterOrganizationScopes(role.scopes).filter(
        (scope) => !callerScopes.has(scope)
      );

      if (escalatedScopes.length > 0) {
        throw forbidden(
          `You cannot assign a role with permissions you do not have: ${escalatedScopes.join(", ")}`
        );
      }

      await db
        .insert(memberRoleAssignments)
        .values({
          id: nanoid(),
          memberId: input.memberId,
          roleId: input.roleId,
        })
        .onConflictDoNothing();

      return { success: true as const };
    }),

  unassign: authorizedProcedure
    .input(assignRoleInputSchema)
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
        .delete(memberRoleAssignments)
        .where(
          and(
            eq(memberRoleAssignments.memberId, input.memberId),
            eq(memberRoleAssignments.roleId, input.roleId)
          )
        );

      return { success: true as const };
    }),
};
