import {
  LEGACY_ROLE_SCOPES,
  ORGANIZATION_SCOPES,
} from "@notra/db/constants/permissions";
import { db } from "@notra/db/drizzle";
import { accessGroupMembers, accessGroups } from "@notra/db/schema";
import type { OrganizationScope } from "@notra/db/types/access-groups";
import { filterOrganizationScopes } from "@notra/db/utils/permissions";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { retryTransientDbError } from "@/lib/db/retry";
import { ScopeResolutionError } from "@/lib/permissions/errors";

const organizationHasAssignments = Effect.fn("organizationHasAssignments")(
  function* ({ organizationId }: { organizationId: string }) {
    const assignment = yield* Effect.tryPromise({
      try: () =>
        retryTransientDbError(() =>
          db
            .select({ id: accessGroupMembers.id })
            .from(accessGroupMembers)
            .innerJoin(
              accessGroups,
              eq(accessGroupMembers.accessGroupId, accessGroups.id)
            )
            .where(eq(accessGroups.organizationId, organizationId))
            .limit(1)
        ),
      catch: (cause) =>
        new ScopeResolutionError({
          message: "Failed to resolve workspace permissions",
          cause,
        }),
    });

    return assignment.length > 0;
  }
);

export const resolveMemberScopes = Effect.fn("resolveMemberScopes")(function* ({
  memberId,
  memberRole,
  organizationId,
}: {
  memberId: string;
  memberRole: string;
  organizationId: string;
}) {
  if (memberRole === "owner" || memberRole === "admin") {
    return [...ORGANIZATION_SCOPES] as OrganizationScope[];
  }

  const memberships = yield* Effect.tryPromise({
    try: () =>
      retryTransientDbError(() =>
        db.query.accessGroupMembers.findMany({
          where: eq(accessGroupMembers.memberId, memberId),
          with: {
            accessGroup: {
              columns: {
                scopes: true,
              },
            },
          },
        })
      ),
    catch: (cause) =>
      new ScopeResolutionError({
        message: "Failed to resolve member permissions",
        cause,
      }),
  });

  if (memberships.length === 0) {
    const hasAdoptedAccessGroups = yield* organizationHasAssignments({
      organizationId,
    });

    if (hasAdoptedAccessGroups) {
      return [] as OrganizationScope[];
    }

    return LEGACY_ROLE_SCOPES[memberRole] ?? [];
  }

  const scopes = new Set<OrganizationScope>();
  for (const membership of memberships) {
    for (const scope of filterOrganizationScopes(
      membership.accessGroup.scopes
    )) {
      scopes.add(scope);
    }
  }

  return [...scopes];
});

export const resolveMemberAccessGroupIds = Effect.fn(
  "resolveMemberAccessGroupIds"
)(function* ({ memberId }: { memberId: string }) {
  const memberships = yield* Effect.tryPromise({
    try: () =>
      retryTransientDbError(() =>
        db.query.accessGroupMembers.findMany({
          where: eq(accessGroupMembers.memberId, memberId),
          columns: {
            accessGroupId: true,
          },
        })
      ),
    catch: (cause) =>
      new ScopeResolutionError({
        message: "Failed to resolve member access groups",
        cause,
      }),
  });

  return memberships.map((membership) => membership.accessGroupId);
});
