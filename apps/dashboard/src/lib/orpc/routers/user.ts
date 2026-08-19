import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { and, count, eq, ne } from "drizzle-orm";
import { Effect } from "effect";
import { deleteAutumnCustomer } from "@/lib/billing/delete-autumn-customer";
import {
  deleteOrganizationFromWorkOS,
  removeMembershipFromWorkOS,
  updateMembershipRoleInWorkOS,
} from "@/lib/organizations/workos-sync";
import { authorizedProcedure } from "@/lib/orpc/base";
import {
  deleteOrganizationChatFiles,
  deleteOrganizationFiles,
  deleteUserFiles,
} from "@/lib/upload/cleanup";
import {
  deleteWithTransfersSchema,
  organizationMembershipActionSchema,
} from "@/schemas/api-params";
import type {
  NextOwnerCandidate,
  OwnedOrganizationSummary,
} from "@/types/user";
import { badRequest, forbidden, notFound } from "../utils/errors";

export const userRouter = {
  organizations: {
    listOwned: authorizedProcedure.handler(async ({ context }) => {
      const ownedMemberships = await db.query.members.findMany({
        where: and(
          eq(members.userId, context.user.id),
          eq(members.role, "owner")
        ),
        with: {
          organizations: true,
        },
      });

      const ownedOrganizations: OwnedOrganizationSummary[] = [];

      for (const membership of ownedMemberships) {
        const org = membership.organizations;

        const [memberCountResult] = await db
          .select({ count: count() })
          .from(members)
          .where(eq(members.organizationId, org.id));

        const memberCount = memberCountResult?.count ?? 0;

        let nextOwnerCandidate: NextOwnerCandidate | null = null;

        if (memberCount > 1) {
          const adminCandidate = await db.query.members.findFirst({
            where: and(
              eq(members.organizationId, org.id),
              ne(members.userId, context.user.id),
              eq(members.role, "admin")
            ),
            with: {
              users: true,
            },
          });

          if (adminCandidate?.users) {
            nextOwnerCandidate = {
              email: adminCandidate.users.email,
              id: adminCandidate.users.id,
              name: adminCandidate.users.name,
              role: adminCandidate.role,
            };
          } else {
            const memberCandidate = await db.query.members.findFirst({
              where: and(
                eq(members.organizationId, org.id),
                ne(members.userId, context.user.id)
              ),
              with: {
                users: true,
              },
            });

            if (memberCandidate?.users) {
              nextOwnerCandidate = {
                email: memberCandidate.users.email,
                id: memberCandidate.users.id,
                name: memberCandidate.users.name,
                role: memberCandidate.role,
              };
            }
          }
        }

        ownedOrganizations.push({
          heardAboutNotraOther: org.heardAboutNotraOther,
          heardAboutNotraSource: org.heardAboutNotraSource,
          id: org.id,
          logo: org.logo,
          memberCount,
          name: org.name,
          nextOwnerCandidate,
          slug: org.slug,
        });
      }

      return { ownedOrganizations };
    }),
  },
  membership: {
    applyAction: authorizedProcedure
      .input(organizationMembershipActionSchema)
      .handler(async ({ context, input }) => {
        let shouldCleanupDeletedOrganization = false;

        const result = await db.transaction(async (tx) => {
          await tx
            .select({ id: members.id })
            .from(members)
            .where(eq(members.userId, context.user.id))
            .for("update");

          const membership = await tx.query.members.findFirst({
            columns: {
              id: true,
              role: true,
            },
            where: and(
              eq(members.organizationId, input.organizationId),
              eq(members.userId, context.user.id)
            ),
          });

          if (!membership) {
            throw forbidden("You are not a member of this organization");
          }

          const [membershipCountResult] = await tx
            .select({ count: count() })
            .from(members)
            .where(eq(members.userId, context.user.id));

          const membershipCount = membershipCountResult?.count ?? 0;

          if (membershipCount <= 1) {
            throw badRequest("You must keep at least one organization");
          }

          if (input.action === "delete") {
            if (membership.role !== "owner") {
              throw forbidden(
                "Only organization owners can delete organizations"
              );
            }

            const organization = await tx.query.organizations.findFirst({
              columns: { workosOrgId: true },
              where: eq(organizations.id, input.organizationId),
            });

            await tx
              .delete(organizations)
              .where(eq(organizations.id, input.organizationId));

            shouldCleanupDeletedOrganization = true;

            return {
              action: "delete" as const,
              success: true,
              workosOrgId: organization?.workosOrgId ?? null,
            };
          }

          if (membership.role === "owner") {
            throw badRequest(
              "Organization owners cannot leave directly. Delete the organization instead."
            );
          }

          await tx
            .delete(members)
            .where(
              and(
                eq(members.organizationId, input.organizationId),
                eq(members.userId, context.user.id)
              )
            );

          return {
            action: "leave" as const,
            success: true,
          };
        });

        if (result.action === "delete") {
          await Effect.runPromise(
            deleteOrganizationFromWorkOS(result.workosOrgId)
          );
        } else {
          await Effect.runPromise(
            removeMembershipFromWorkOS(input.organizationId, context.user.id)
          );
        }

        if (shouldCleanupDeletedOrganization) {
          await Promise.all([
            deleteOrganizationFiles(input.organizationId).catch((error) => {
              console.error(
                `[Delete Org] Failed to cleanup R2 files for ${input.organizationId}:`,
                error
              );
            }),
            deleteOrganizationChatFiles(input.organizationId).catch((error) => {
              console.error(
                `[Delete Org] Failed to cleanup chat files for ${input.organizationId}:`,
                error
              );
            }),
            deleteAutumnCustomer(input.organizationId).catch((error) => {
              console.error(
                `[Delete Org] Failed to cancel Autumn subscription for ${input.organizationId}:`,
                error
              );
            }),
          ]);
        }

        return result;
      }),
  },
  deleteWithTransfers: authorizedProcedure
    .input(deleteWithTransfersSchema)
    .handler(async ({ context, input }) => {
      const organizationsToCleanup: string[] = [];

      for (const transfer of input.transfers) {
        const outcome = await db.transaction(async (tx) => {
          const membership = await tx.query.members.findFirst({
            where: and(
              eq(members.organizationId, transfer.orgId),
              eq(members.userId, context.user.id),
              eq(members.role, "owner")
            ),
          });

          if (!membership) {
            throw forbidden(
              `You are not the owner of organization ${transfer.orgId}`
            );
          }

          if (transfer.action === "transfer") {
            let newOwner = await tx.query.members.findFirst({
              where: and(
                eq(members.organizationId, transfer.orgId),
                ne(members.userId, context.user.id),
                eq(members.role, "admin")
              ),
            });

            if (!newOwner) {
              newOwner = await tx.query.members.findFirst({
                where: and(
                  eq(members.organizationId, transfer.orgId),
                  ne(members.userId, context.user.id)
                ),
              });
            }

            if (!newOwner) {
              throw badRequest(
                `No other members to transfer ownership to for organization ${transfer.orgId}`
              );
            }

            await tx
              .update(members)
              .set({ role: "owner" })
              .where(eq(members.id, newOwner.id));

            await tx
              .delete(members)
              .where(
                and(
                  eq(members.organizationId, transfer.orgId),
                  eq(members.userId, context.user.id)
                )
              );

            return {
              kind: "transfer" as const,
              newOwnerUserId: newOwner.userId,
            };
          }

          const existingOrganization = await tx.query.organizations.findFirst({
            columns: { id: true, workosOrgId: true },
            where: eq(organizations.id, transfer.orgId),
          });

          if (!existingOrganization) {
            throw notFound(`Organization ${transfer.orgId} not found`);
          }

          await tx
            .delete(organizations)
            .where(eq(organizations.id, transfer.orgId));

          organizationsToCleanup.push(transfer.orgId);

          return {
            kind: "delete" as const,
            workosOrgId: existingOrganization.workosOrgId,
          };
        });

        if (outcome.kind === "transfer") {
          await Effect.runPromise(
            updateMembershipRoleInWorkOS(
              transfer.orgId,
              outcome.newOwnerUserId,
              "owner"
            )
          );
          await Effect.runPromise(
            removeMembershipFromWorkOS(transfer.orgId, context.user.id)
          );
        } else {
          await Effect.runPromise(
            deleteOrganizationFromWorkOS(outcome.workosOrgId)
          );
        }
      }

      await Promise.all(
        organizationsToCleanup.flatMap((orgId) => [
          deleteOrganizationFiles(orgId).catch((error) => {
            console.error(
              `[Delete Org] Failed to cleanup R2 files for ${orgId}:`,
              error
            );
          }),
          deleteOrganizationChatFiles(orgId).catch((error) => {
            console.error(
              `[Delete Org] Failed to cleanup chat files for ${orgId}:`,
              error
            );
          }),
          deleteAutumnCustomer(orgId).catch((error) => {
            console.error(
              `[Delete Org] Failed to cancel Autumn subscription for ${orgId}:`,
              error
            );
          }),
        ])
      );

      await deleteUserFiles(context.user.id).catch((error) => {
        console.error(
          `[Delete User] Failed to cleanup R2 files for user ${context.user.id}:`,
          error
        );
      });

      return {
        message: "Organizations processed. You can now delete your account.",
        success: true,
      };
    }),
};
