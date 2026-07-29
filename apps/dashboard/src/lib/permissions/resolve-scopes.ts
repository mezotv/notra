import {
  LEGACY_ROLE_SCOPES,
  ORGANIZATION_SCOPES,
} from "@notra/db/constants/permissions";
import { db } from "@notra/db/drizzle";
import { memberRoleAssignments } from "@notra/db/schema";
import type { OrganizationScope } from "@notra/db/types/roles";
import { filterOrganizationScopes } from "@notra/db/utils/permissions";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { retryTransientDbError } from "@/lib/db/retry";
import { ScopeResolutionError } from "@/lib/permissions/errors";

export const resolveMemberScopes = Effect.fn("resolveMemberScopes")(function* ({
  memberId,
  memberRole,
}: {
  memberId: string;
  memberRole: string;
}) {
  if (memberRole === "owner") {
    return [...ORGANIZATION_SCOPES] as OrganizationScope[];
  }

  const assignments = yield* Effect.tryPromise({
    try: () =>
      retryTransientDbError(() =>
        db.query.memberRoleAssignments.findMany({
          where: eq(memberRoleAssignments.memberId, memberId),
          with: {
            role: {
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

  if (assignments.length === 0) {
    return LEGACY_ROLE_SCOPES[memberRole] ?? [];
  }

  const scopes = new Set<OrganizationScope>();
  for (const assignment of assignments) {
    for (const scope of filterOrganizationScopes(assignment.role.scopes)) {
      scopes.add(scope);
    }
  }

  return [...scopes];
});

export const resolveMemberRoleIds = Effect.fn("resolveMemberRoleIds")(
  function* ({ memberId }: { memberId: string }) {
    const assignments = yield* Effect.tryPromise({
      try: () =>
        retryTransientDbError(() =>
          db.query.memberRoleAssignments.findMany({
            where: eq(memberRoleAssignments.memberId, memberId),
            columns: {
              roleId: true,
            },
          })
        ),
      catch: (cause) =>
        new ScopeResolutionError({
          message: "Failed to resolve member roles",
          cause,
        }),
    });

    return assignments.map((assignment) => assignment.roleId);
  }
);
