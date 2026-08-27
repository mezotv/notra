import { db } from "@notra/db/drizzle";
import { users } from "@notra/db/schema";
import { getWorkOS } from "@workos-inc/authkit-nextjs";
import type { User } from "@workos-inc/node";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { isValid as isNotDisposableEmail } from "mailchecker";

import { UserSyncError } from "@/lib/auth/errors";

function buildUserName(workosUser: User) {
  const name = [workosUser.firstName, workosUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || workosUser.email;
}

const linkWorkOSExternalId = Effect.fn("auth.sync.linkWorkOSExternalId")(
  function* (workosUserId: string, localUserId: string) {
    yield* Effect.tryPromise({
      try: () =>
        getWorkOS().userManagement.updateUser({
          userId: workosUserId,
          externalId: localUserId,
        }),
      catch: (cause) =>
        new UserSyncError({
          message: "Failed to set WorkOS external id",
          cause,
        }),
    }).pipe(
      Effect.catch((error) =>
        Effect.logWarning("Could not backlink WorkOS external id").pipe(
          Effect.annotateLogs({ workosUserId, error: error.message })
        )
      )
    );
  }
);

export const ensureLocalUser = Effect.fn("auth.sync.ensureLocalUser")(
  function* (workosUser: User) {
    const byWorkosId = yield* Effect.tryPromise({
      try: () =>
        db.query.users.findFirst({
          where: eq(users.workosUserId, workosUser.id),
        }),
      catch: (cause) =>
        new UserSyncError({ message: "Failed to look up user", cause }),
    });

    if (byWorkosId) {
      return byWorkosId;
    }

    const byEmail = yield* Effect.tryPromise({
      try: () =>
        db.query.users.findFirst({
          where: eq(users.email, workosUser.email),
        }),
      catch: (cause) =>
        new UserSyncError({ message: "Failed to look up user", cause }),
    });

    if (byEmail) {
      if (!workosUser.emailVerified) {
        return yield* Effect.fail(
          new UserSyncError({
            message:
              "Verify your email address before signing in to this account",
          })
        );
      }

      const [linked] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(users)
            .set({ workosUserId: workosUser.id })
            .where(eq(users.id, byEmail.id))
            .returning(),
        catch: (cause) =>
          new UserSyncError({
            message: "Failed to link user to WorkOS",
            cause,
          }),
      });

      yield* linkWorkOSExternalId(workosUser.id, byEmail.id);
      return linked ?? byEmail;
    }

    if (!isNotDisposableEmail(workosUser.email)) {
      return yield* Effect.fail(
        new UserSyncError({
          message: "Disposable email addresses are not allowed",
        })
      );
    }

    const [created] = yield* Effect.tryPromise({
      try: () =>
        db
          .insert(users)
          .values({
            id: crypto.randomUUID(),
            name: buildUserName(workosUser),
            email: workosUser.email,
            emailVerified: workosUser.emailVerified,
            image: workosUser.profilePictureUrl,
            workosUserId: workosUser.id,
          })
          .returning(),
      catch: (cause) =>
        new UserSyncError({ message: "Failed to create user", cause }),
    });

    if (!created) {
      return yield* Effect.fail(
        new UserSyncError({ message: "User creation returned no row" })
      );
    }

    yield* linkWorkOSExternalId(workosUser.id, created.id);

    return created;
  }
);
