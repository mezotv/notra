import { db } from "@notra/db/drizzle";
import { members, organizations, users } from "@notra/db/schema";
import { getWorkOS } from "@workos-inc/authkit-nextjs";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { WorkOSSyncError } from "@/lib/organizations/errors";

const ensureWorkOSOrganization = Effect.fn(
  "organizations.sync.ensureWorkOSOrganization"
)(function* (organizationId: string) {
  return yield* Effect.tryPromise({
    try: async () => {
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
        columns: { name: true, workosOrgId: true },
      });

      if (!organization) {
        throw new Error(`Organization ${organizationId} not found`);
      }

      if (organization.workosOrgId) {
        return { workosOrgId: organization.workosOrgId, healed: false };
      }

      let workosOrgId: string;
      try {
        const created = await getWorkOS().organizations.createOrganization({
          name: organization.name,
          externalId: organizationId,
        });
        workosOrgId = created.id;
      } catch (createError) {
        try {
          const existing =
            await getWorkOS().organizations.getOrganizationByExternalId(
              organizationId
            );
          workosOrgId = existing.id;
        } catch {
          throw createError;
        }
      }

      await db
        .update(organizations)
        .set({ workosOrgId })
        .where(eq(organizations.id, organizationId));

      return { workosOrgId, healed: true };
    },
    catch: (cause) =>
      new WorkOSSyncError({
        message: "Failed to link organization to WorkOS",
        cause,
      }),
  });
});

export const ensureWorkOSOrganizationWithMembers = Effect.fn(
  "organizations.sync.ensureWorkOSOrganizationWithMembers"
)(function* (organizationId: string) {
  const result = yield* ensureWorkOSOrganization(organizationId);

  if (result.healed) {
    yield* syncAllMembershipsToWorkOS(organizationId);
  }

  return result.workosOrgId;
});

const syncAllMembershipsToWorkOS = Effect.fn(
  "organizations.sync.syncAllMemberships"
)(function* (organizationId: string) {
  const rows = yield* Effect.tryPromise({
    try: () =>
      db.query.members.findMany({
        where: eq(members.organizationId, organizationId),
        columns: { userId: true, role: true },
      }),
    catch: (cause) =>
      new WorkOSSyncError({ message: "Failed to load members", cause }),
  });

  for (const row of rows) {
    yield* syncMembershipToWorkOS(organizationId, row.userId, row.role);
  }
});

const syncMembershipToWorkOS = Effect.fn(
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

      try {
        await getWorkOS().userManagement.createOrganizationMembership({
          organizationId: organization.workosOrgId,
          userId: user.workosUserId,
          roleSlug,
        });
      } catch (createError) {
        const existing =
          await getWorkOS().userManagement.listOrganizationMemberships({
            organizationId: organization.workosOrgId,
            userId: user.workosUserId,
          });

        if (existing.data.length === 0) {
          throw createError;
        }
      }
    },
    catch: (cause) =>
      new WorkOSSyncError({
        message: "Failed to create WorkOS membership",
        cause,
      }),
  });
});
