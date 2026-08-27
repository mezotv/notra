"use server";

import { db } from "@notra/db/drizzle";
import { socialConnections, users } from "@notra/db/schema";
import { getWorkOS, signOut } from "@workos-inc/authkit-nextjs";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { sendResetPasswordAction } from "@/lib/email/actions";
import { OrganizationActionError } from "@/lib/organizations/errors";
import { requireSession } from "@/lib/organizations/guards";
import { runOrganizationAction } from "@/lib/organizations/run-action";
import type { SessionUser } from "@/types/auth/session";
import type { UpdateUserInput } from "@/types/auth/user-actions";
import type { AccountInfo, ActionResult } from "@/types/organizations/actions";

const tryAction = <T>(run: () => Promise<T>, message: string) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new OrganizationActionError({ message, cause }),
  });

export async function signOutAction(options?: { returnTo?: string }) {
  await signOut(options);
}

export async function updateUserAction(
  input: UpdateUserInput
): Promise<ActionResult<SessionUser>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      const updates: Partial<{
        name: string;
        image: string | null;
        hidePersonalData: boolean;
        showAgentStats: boolean;
      }> = {};

      if (input.name !== undefined) {
        updates.name = input.name;
      }
      if (input.image !== undefined) {
        updates.image = input.image;
      }
      if (input.hidePersonalData !== undefined) {
        updates.hidePersonalData = input.hidePersonalData;
      }
      if (input.showAgentStats !== undefined) {
        updates.showAgentStats = input.showAgentStats;
      }

      const [updated] = yield* tryAction(
        () =>
          db
            .update(users)
            .set(updates)
            .where(eq(users.id, session.user.id))
            .returning(),
        "Failed to update user"
      );

      if (!updated) {
        return yield* Effect.fail(
          new OrganizationActionError({ message: "User not found" })
        );
      }

      if (input.name !== undefined && updated.workosUserId) {
        const [firstName, ...rest] = input.name.split(" ");
        yield* tryAction(
          () =>
            getWorkOS().userManagement.updateUser({
              userId: updated.workosUserId ?? "",
              firstName,
              lastName: rest.join(" ") || undefined,
            }),
          "Failed to sync user profile"
        ).pipe(
          Effect.catch((error) =>
            Effect.logWarning("Could not sync user profile to WorkOS").pipe(
              Effect.annotateLogs({ userId: updated.id, error: error.message })
            )
          )
        );
      }

      return updated;
    })
  );
}

export async function deleteUserAction(): Promise<
  ActionResult<{ deleted: boolean }>
> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      if (session.user.workosUserId) {
        yield* tryAction(
          () =>
            getWorkOS().userManagement.deleteUser(
              session.user.workosUserId ?? ""
            ),
          "Failed to delete WorkOS user"
        ).pipe(
          Effect.catch((error) =>
            Effect.logWarning("Could not delete WorkOS user").pipe(
              Effect.annotateLogs({
                userId: session.user.id,
                error: error.message,
              })
            )
          )
        );
      }

      yield* tryAction(
        () => db.delete(users).where(eq(users.id, session.user.id)),
        "Failed to delete user"
      );

      return { deleted: true };
    })
  );
}

export async function requestPasswordResetAction(): Promise<
  ActionResult<{ sent: boolean }>
> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      const reset = yield* tryAction(
        () =>
          getWorkOS().userManagement.createPasswordReset({
            email: session.user.email,
          }),
        "Failed to create password reset"
      );

      yield* tryAction(
        () =>
          sendResetPasswordAction({
            userEmail: session.user.email,
            resetLink: reset.passwordResetUrl,
          }),
        "Failed to send password reset email"
      );

      return { sent: true };
    })
  );
}

export async function listAccountsAction(): Promise<
  ActionResult<AccountInfo[]>
> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      const rows = yield* tryAction(
        () =>
          db.query.socialConnections.findMany({
            where: eq(socialConnections.userId, session.user.id),
          }),
        "Failed to list connected accounts"
      );

      return rows.map((row) => ({
        id: row.id,
        providerId: row.provider,
        accountId: row.providerAccountId,
        scopes: row.scope?.split(" ").filter(Boolean) ?? [],
        createdAt: row.createdAt,
      }));
    })
  );
}

export async function unlinkAccountAction(input: {
  providerId: string;
}): Promise<ActionResult<{ removed: boolean }>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      yield* tryAction(
        () =>
          db
            .delete(socialConnections)
            .where(
              and(
                eq(socialConnections.userId, session.user.id),
                eq(socialConnections.provider, input.providerId)
              )
            ),
        "Failed to unlink account"
      );

      return { removed: true };
    })
  );
}
