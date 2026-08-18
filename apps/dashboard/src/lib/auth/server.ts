import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { LAST_VISITED_ORGANIZATION_COOKIE } from "@/constants/cookies";
import { isUserBanned } from "@/lib/auth/banned";
import { AuthSessionError } from "@/lib/auth/errors";
import { ensureLocalUser } from "@/lib/auth/sync";
import type { AuthSessionData } from "@/types/auth/session";

const readLastVisitedOrganizationSlug = Effect.fn(
  "auth.session.readLastVisitedSlug"
)(function* () {
  const cookieStore = yield* Effect.tryPromise({
    try: () => cookies(),
    catch: (cause) =>
      new AuthSessionError({ message: "Failed to read cookies", cause }),
  });

  const slug = cookieStore.get(LAST_VISITED_ORGANIZATION_COOKIE)?.value;
  return slug?.trim() || null;
});

const resolveActiveOrganizationId = Effect.fn(
  "auth.session.resolveActiveOrganization"
)(function* (userId: string) {
  const lastVisitedSlug = yield* readLastVisitedOrganizationSlug().pipe(
    Effect.catch(() => Effect.succeed(null))
  );

  if (lastVisitedSlug) {
    const organization = yield* Effect.tryPromise({
      try: () =>
        db.query.organizations.findFirst({
          where: eq(organizations.slug, lastVisitedSlug),
          columns: { id: true },
          with: {
            members: {
              where: eq(members.userId, userId),
              columns: { id: true },
            },
          },
        }),
      catch: (cause) =>
        new AuthSessionError({
          message: "Failed to resolve organization from cookie",
          cause,
        }),
    });

    if (organization && organization.members.length > 0) {
      return organization.id;
    }
  }

  const membership = yield* Effect.tryPromise({
    try: () =>
      db.query.members.findFirst({
        where: eq(members.userId, userId),
        columns: { organizationId: true },
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      }),
    catch: (cause) =>
      new AuthSessionError({
        message: "Failed to resolve membership",
        cause,
      }),
  });

  return membership?.organizationId ?? null;
});

const buildAuthSession = Effect.fn("auth.session.build")(function* (
  workosUser: Parameters<typeof ensureLocalUser>[0],
  impersonatorEmail: string | null
) {
  const user = yield* ensureLocalUser(workosUser);

  if (isUserBanned(user)) {
    return yield* Effect.fail(
      new AuthSessionError({
        message: "User is banned",
        cause: null,
      })
    );
  }

  const activeOrganizationId = yield* resolveActiveOrganizationId(user.id);

  const session: AuthSessionData = {
    session: {
      userId: user.id,
      activeOrganizationId,
      impersonatedBy: impersonatorEmail,
    },
    user,
  };

  return session;
});

export async function getAuthSession(): Promise<AuthSessionData | null> {
  let authResult: Awaited<ReturnType<typeof withAuth>>;

  try {
    authResult = await withAuth();
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error reading AuthKit session", error);
    return null;
  }

  if (!authResult.user) {
    return null;
  }

  return await Effect.runPromise(
    buildAuthSession(
      authResult.user,
      authResult.impersonator?.email ?? null
    ).pipe(
      Effect.catch((error) =>
        Effect.logWarning("Failed to build auth session").pipe(
          Effect.annotateLogs({
            workosUserId: authResult.user?.id,
            error: error.message,
          }),
          Effect.as(null)
        )
      )
    )
  );
}
