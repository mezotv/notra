"use server";

import { db } from "@notra/db/drizzle";
import { users } from "@notra/db/schema";
import { asc, ilike, or } from "drizzle-orm";
import { Effect } from "effect";
import { IMPERSONATION_USER_RESULT_LIMIT } from "@/constants/auth";
import { hasAdminRole } from "@/lib/auth/role";
import { OrganizationActionError } from "@/lib/organizations/errors";
import { requireSession } from "@/lib/organizations/guards";
import { runOrganizationAction } from "@/lib/organizations/run-action";
import type { ImpersonationUser, ListUsersInput } from "@/types/auth";
import type { ActionResult } from "@/types/organization";

export async function listUsersAction(
  input?: ListUsersInput
): Promise<ActionResult<ImpersonationUser[]>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      if (!hasAdminRole(session.user.role)) {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "You do not have permission to list users",
          })
        );
      }

      const search = input?.search?.trim();

      const rows = yield* Effect.tryPromise({
        try: () =>
          db.query.users.findMany({
            where: search
              ? or(
                  ilike(users.name, `%${search}%`),
                  ilike(users.email, `%${search}%`)
                )
              : undefined,
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              banned: true,
            },
            orderBy: [asc(users.name)],
            limit: IMPERSONATION_USER_RESULT_LIMIT,
          }),
        catch: (cause) =>
          new OrganizationActionError({
            message: "Failed to list users",
            cause,
          }),
      });

      return rows;
    })
  );
}
