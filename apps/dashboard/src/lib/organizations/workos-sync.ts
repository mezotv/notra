import { db } from "@notra/db/drizzle";
import { organizations, users } from "@notra/db/schema";
import { getWorkOS } from "@workos-inc/authkit-nextjs";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { WorkOSSyncError } from "@/lib/organizations/errors";

const logSyncFailure = (context: Record<string, unknown>) =>
  Effect.catch((error: WorkOSSyncError) =>
    Effect.logWarning("WorkOS sync failed").pipe(
      Effect.annotateLogs({ ...context, error: error.message })
    )
  );

export const syncOrganizationToWorkOS = Effect.fn(
  "organizations.sync.createWorkOSOrganization"
)(function* (organizationId: string, name: string) {
  yield* Effect.tryPromise({
    try: async () => {
      const workosOrganization =
        await getWorkOS().organizations.createOrganization({
          name,
          externalId: organizationId,
        });

      await db
        .update(organizations)
        .set({ workosOrgId: workosOrganization.id })
        .where(eq(organizations.id, organizationId));
    },
    catch: (cause) =>
      new WorkOSSyncError({
        message: "Failed to create WorkOS organization",
        cause,
      }),
  }).pipe(logSyncFailure({ organizationId }));
});

export const syncMembershipToWorkOS = Effect.fn(
  "organizations.sync.createWorkOSMembership"
)(function* (organizationId: string, userId: string, roleSlug?: string) {
  yield* Effect.tryPromise({
    try: async () => {
      const [organization, user] = await Promise.all([
        db.query.organizations.findFirst({
          where: eq(organizations.id, organizationId),
          columns: { workosOrgId: true },
        }),
        db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { workosUserId: true },
        }),
      ]);

      if (!(organization?.workosOrgId && user?.workosUserId)) {
        return;
      }

      await getWorkOS().userManagement.createOrganizationMembership({
        organizationId: organization.workosOrgId,
        userId: user.workosUserId,
        roleSlug,
      });
    },
    catch: (cause) =>
      new WorkOSSyncError({
        message: "Failed to create WorkOS membership",
        cause,
      }),
  }).pipe(logSyncFailure({ organizationId, userId }));
});

export const removeMembershipFromWorkOS = Effect.fn(
  "organizations.sync.removeWorkOSMembership"
)(function* (organizationId: string, userId: string) {
  yield* Effect.tryPromise({
    try: async () => {
      const [organization, user] = await Promise.all([
        db.query.organizations.findFirst({
          where: eq(organizations.id, organizationId),
          columns: { workosOrgId: true },
        }),
        db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { workosUserId: true },
        }),
      ]);

      if (!(organization?.workosOrgId && user?.workosUserId)) {
        return;
      }

      const memberships =
        await getWorkOS().userManagement.listOrganizationMemberships({
          organizationId: organization.workosOrgId,
          userId: user.workosUserId,
        });

      await Promise.all(
        memberships.data.map((membership) =>
          getWorkOS().userManagement.deleteOrganizationMembership(membership.id)
        )
      );
    },
    catch: (cause) =>
      new WorkOSSyncError({
        message: "Failed to remove WorkOS membership",
        cause,
      }),
  }).pipe(logSyncFailure({ organizationId, userId }));
});
