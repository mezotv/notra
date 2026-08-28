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
import { validateActionInput } from "@/lib/organizations/validate-input";
import { listUsersInputSchema } from "@/schemas/auth-actions";
import type { ImpersonationUser, ListUsersInput } from "@/types/auth";
import type { ActionResult } from "@/types/organization";
import { escapeLikePattern } from "@/utils/sql";

export async function listUsersAction(
  rawInput?: ListUsersInput
): Promise<ActionResult<ImpersonationUser[]>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const input = yield* validateActionInput(listUsersInputSchema, rawInput);

      if (!hasAdminRole(session.user.role)) {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "You do not have permission to list users",
          })
        );
      }

      const search = input?.search;
      const searchPattern = search ? `%${escapeLikePattern(search)}%` : null;

      const rows = yield* Effect.tryPromise({
        try: () =>
          db.query.users.findMany({
            where: searchPattern
              ? or(
                  ilike(users.name, searchPattern),
                  ilike(users.email, searchPattern)
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
