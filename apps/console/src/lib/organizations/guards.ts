import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { getAuthSession } from "@/lib/auth/server";
import { OrganizationActionError } from "@/lib/organizations/errors";
import type { AuthSessionData } from "@/types/auth";

export const requireSession = Effect.fn("organizations.guards.requireSession")(
  function* () {
    const session = yield* Effect.tryPromise({
      try: () => getAuthSession(),
      catch: (cause) =>
        new OrganizationActionError({
          message: "Failed to load session",
          cause,
        }),
    });

    if (!session) {
      return yield* Effect.fail(
        new OrganizationActionError({ message: "Unauthorized" })
      );
    }

    return session;
  }
);

export const requireMembership = Effect.fn(
  "organizations.guards.requireMembership"
)(function* (session: AuthSessionData, organizationId: string) {
  const membership = yield* Effect.tryPromise({
    try: () =>
      db.query.members.findFirst({
        where: and(
          eq(members.userId, session.user.id),
          eq(members.organizationId, organizationId)
        ),
      }),
    catch: (cause) =>
      new OrganizationActionError({
        message: "Failed to check membership",
        cause,
      }),
  });

  if (!membership) {
    return yield* Effect.fail(
      new OrganizationActionError({
        message: "You are not a member of this organization",
      })
    );
  }

  return membership;
});
