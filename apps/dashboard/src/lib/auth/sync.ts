import { db } from "@notra/db/drizzle";
import { socialConnections, users } from "@notra/db/schema";
import { getWorkOS } from "@workos-inc/authkit-nextjs";
import type { User } from "@workos-inc/node";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { isValid as isNotDisposableEmail } from "mailchecker";
import { SocialConnectionError, UserSyncError } from "@/lib/auth/errors";
import { sendWelcomeEmailAction } from "@/lib/email/actions";
import type {
  OAuthProviderTokens,
  SyncAuthenticatedUserInput,
} from "@/types/auth/sync";

const GITHUB_USER_ENDPOINT = "https://api.github.com/user";

const AUTH_METHOD_PROVIDERS: Record<string, string> = {
  GitHubOAuth: "github",
  GoogleOAuth: "google",
};

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

const fetchGitHubAccountId = Effect.fn("auth.sync.fetchGitHubAccountId")(
  function* (accessToken: string) {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(GITHUB_USER_ENDPOINT, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
          },
        }),
      catch: (cause) =>
        new SocialConnectionError({
          message: "Failed to fetch GitHub account",
          cause,
        }),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new SocialConnectionError({
          message: `GitHub account lookup failed with status ${response.status}`,
          cause: null,
        })
      );
    }

    const payload = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (cause) =>
        new SocialConnectionError({
          message: "Failed to parse GitHub account response",
          cause,
        }),
    });

    if (
      payload &&
      typeof payload === "object" &&
      "id" in payload &&
      (typeof payload.id === "number" || typeof payload.id === "string")
    ) {
      return String(payload.id);
    }

    return yield* Effect.fail(
      new SocialConnectionError({
        message: "GitHub account response missing id",
        cause: null,
      })
    );
  }
);

const persistSocialConnection = Effect.fn("auth.sync.persistSocialConnection")(
  function* (userId: string, provider: string, tokens: OAuthProviderTokens) {
    const providerAccountId =
      provider === "github"
        ? yield* fetchGitHubAccountId(tokens.accessToken)
        : "";

    yield* Effect.tryPromise({
      try: () =>
        db
          .insert(socialConnections)
          .values({
            id: crypto.randomUUID(),
            userId,
            provider,
            providerAccountId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? null,
            scope: tokens.scopes?.join(" ") ?? null,
            accessTokenExpiresAt: tokens.expiresAt
              ? new Date(tokens.expiresAt)
              : null,
          })
          .onConflictDoUpdate({
            target: [socialConnections.userId, socialConnections.provider],
            set: {
              providerAccountId,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken ?? null,
              scope: tokens.scopes?.join(" ") ?? null,
              accessTokenExpiresAt: tokens.expiresAt
                ? new Date(tokens.expiresAt)
                : null,
            },
          }),
      catch: (cause) =>
        new SocialConnectionError({
          message: "Failed to persist social connection",
          cause,
        }),
    });
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
    yield* Effect.sync(() => {
      sendWelcomeEmailAction({ userEmail: created.email });
    });

    return created;
  }
);

export const syncAuthenticatedUser = Effect.fn("auth.sync.authenticatedUser")(
  function* ({
    workosUser,
    oauthTokens,
    authenticationMethod,
  }: SyncAuthenticatedUserInput) {
    const localUser = yield* ensureLocalUser(workosUser);

    const provider = authenticationMethod
      ? AUTH_METHOD_PROVIDERS[authenticationMethod]
      : undefined;

    if (provider && oauthTokens?.accessToken) {
      yield* persistSocialConnection(localUser.id, provider, oauthTokens).pipe(
        Effect.catch((error) =>
          Effect.logWarning("Could not persist social connection").pipe(
            Effect.annotateLogs({
              userId: localUser.id,
              provider,
              error: error.message,
            })
          )
        )
      );
    }

    return localUser;
  }
);
