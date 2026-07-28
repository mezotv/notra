import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import type { SocialAccount } from "post-for-me/resources/social-accounts";
import { SOCIAL_CONNECT_STATE_TTL_SECONDS } from "@/constants/social-connect";
import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";
import {
  fromProviderPlatform,
  getSocialConnectClient,
  hasProviderPremium,
  isSocialConnectConfigured,
  toProviderPlatform,
} from "@/lib/social-connect/client";
import {
  getSocialConnectStatusCode,
  SocialConnectCallbackError,
  SocialConnectConfigError,
  SocialConnectRequestError,
} from "@/lib/social-connect/errors";
import {
  type SocialConnectOAuthState,
  type SocialConnectPlatform,
  socialConnectOAuthStateSchema,
} from "@/schemas/social-accounts";
import type {
  BeginSocialConnectParams,
  CompleteSocialConnectParams,
  CompleteSocialConnectResult,
} from "@/types/services/social-connect";
import { fetchTwitterVerification } from "@/utils/twitter-fetcher";

function getStateKey(state: string) {
  return `social_connect_oauth:${state}`;
}

function isRedirectOverrideRejected(cause: unknown): boolean {
  if (getSocialConnectStatusCode(cause) !== 400) {
    return false;
  }
  const message = cause instanceof Error ? cause.message : "";
  return message.toLowerCase().includes("redirect url override");
}

export const beginSocialConnect = Effect.fn("beginSocialConnect")(function* (
  params: BeginSocialConnectParams
) {
  if (!isSocialConnectConfigured()) {
    return yield* Effect.fail(
      new SocialConnectConfigError({
        message: "Social account linking is not configured",
      })
    );
  }

  const redisClient = redis;
  if (!redisClient) {
    return yield* Effect.fail(
      new SocialConnectConfigError({ message: "Redis is not configured" })
    );
  }

  const state = crypto.randomUUID();
  const oauthState: SocialConnectOAuthState = {
    callbackPath: params.callbackPath,
    organizationId: params.organizationId,
    platform: params.platform,
  };

  yield* Effect.tryPromise({
    try: () =>
      redisClient.set(getStateKey(state), JSON.stringify(oauthState), {
        ex: SOCIAL_CONNECT_STATE_TTL_SECONDS,
      }),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to store connect state",
        cause,
      }),
  });

  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const linkedInConnectionType =
    process.env.SOCIAL_CONNECT_LINKEDIN_ORGANIZATIONS === "true"
      ? ("organization" as const)
      : ("personal" as const);

  const createAuthUrl = (withRedirectOverride: boolean) =>
    Effect.tryPromise({
      try: () =>
        getSocialConnectClient().socialAccounts.createAuthURL({
          platform: toProviderPlatform(params.platform),
          external_id: state,
          ...(withRedirectOverride && baseUrl
            ? {
                redirect_url_override: `${baseUrl}/api/social-accounts/callback`,
              }
            : {}),
          ...(params.platform === "linkedin"
            ? {
                platform_data: {
                  linkedin: { connection_type: linkedInConnectionType },
                },
              }
            : {}),
        }),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to create account connect link",
          cause,
        }),
    });

  const result = yield* createAuthUrl(true).pipe(
    Effect.catch((error) =>
      isRedirectOverrideRejected(error.cause)
        ? createAuthUrl(false)
        : Effect.fail(error)
    )
  );

  if (!result.url) {
    return yield* Effect.fail(
      new SocialConnectRequestError({
        message: "Failed to create account connect link",
        cause: null,
      })
    );
  }

  return { url: result.url };
});

const loadOAuthStateForAccount = Effect.fn("loadOAuthStateForAccount")(
  function* (state: string) {
    const redisClient = redis;
    if (!redisClient) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "invalid_callback" })
      );
    }

    const raw = yield* Effect.tryPromise({
      try: () => redisClient.getdel<string>(getStateKey(state)),
      catch: (cause) =>
        new SocialConnectCallbackError({ code: "expired_state", cause }),
    });

    if (!raw) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "expired_state" })
      );
    }

    const stateJson = yield* Effect.try({
      try: (): unknown => (typeof raw === "string" ? JSON.parse(raw) : raw),
      catch: (cause) =>
        new SocialConnectCallbackError({ code: "invalid_callback", cause }),
    });

    const parsedState = socialConnectOAuthStateSchema.safeParse(stateJson);
    if (!parsedState.success) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "invalid_callback" })
      );
    }

    return parsedState.data;
  }
);

const buildAccountDetails = Effect.fn("buildAccountDetails")(function* (
  platform: SocialConnectPlatform,
  account: SocialAccount
) {
  const username = account.username ?? account.user_id;
  const rawProfileImageUrl = account.profile_photo_url;
  const profileImageUrl =
    rawProfileImageUrl && platform === "twitter"
      ? normalizeTwitterProfileImageUrl(rawProfileImageUrl)
      : rawProfileImageUrl;

  let displayName = username;
  let verifiedType: string | null = null;
  if (platform === "twitter") {
    const verification = yield* fetchTwitterVerification(username).pipe(
      Effect.catch(() => Effect.succeed(null))
    );
    displayName = verification?.name ?? username;
    verifiedType =
      verification?.verifiedType ??
      (hasProviderPremium(account.metadata) ? "blue" : null);
  }
  const verified = verifiedType !== null && verifiedType !== "none";

  return { username, displayName, profileImageUrl, verified, verifiedType };
});

export const completeSocialConnect = Effect.fn("completeSocialConnect")(
  function* (params: CompleteSocialConnectParams) {
    if (!isSocialConnectConfigured()) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "callback_failed" })
      );
    }

    const firstAccountId = params.accountIds.at(0);
    if (!firstAccountId) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "connection_failed" })
      );
    }

    const client = getSocialConnectClient();

    const accounts = yield* Effect.tryPromise({
      try: () =>
        Promise.all(
          params.accountIds.map((accountId) =>
            client.socialAccounts.retrieve(accountId)
          )
        ),
      catch: (cause) =>
        new SocialConnectCallbackError({ code: "account_fetch_failed", cause }),
    });

    const state = accounts.at(0)?.external_id;
    if (!state) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "invalid_callback" })
      );
    }

    const stateAccounts = accounts.filter(
      (account) => account.external_id === state
    );
    if (stateAccounts.length < accounts.length) {
      yield* Effect.logWarning(
        "Ignoring callback accounts that do not match the connect state"
      );
    }

    const oauthState = yield* loadOAuthStateForAccount(state);

    for (const account of stateAccounts) {
      const platform =
        fromProviderPlatform(account.platform) ?? oauthState.platform;
      const details = yield* buildAccountDetails(platform, account);
      yield* upsertConnectedAccount({
        organizationId: oauthState.organizationId,
        platform,
        providerAccountId: account.id,
        ...details,
      });
      yield* tagProviderAccount(account.id, oauthState.organizationId);
    }

    const result: CompleteSocialConnectResult = {
      callbackPath: oauthState.callbackPath,
      platform: oauthState.platform,
    };
    return result;
  }
);

const upsertConnectedAccount = Effect.fn("upsertConnectedAccount")(
  function* (input: {
    organizationId: string;
    platform: SocialConnectPlatform;
    providerAccountId: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
    verified: boolean;
    verifiedType: string | null;
  }) {
    yield* Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const existing = await tx.query.connectedSocialAccounts.findFirst({
            columns: { id: true },
            where: and(
              eq(connectedSocialAccounts.organizationId, input.organizationId),
              eq(connectedSocialAccounts.provider, input.platform),
              eq(
                connectedSocialAccounts.providerAccountId,
                input.providerAccountId
              )
            ),
          });

          if (existing) {
            await tx
              .update(connectedSocialAccounts)
              .set({
                username: input.username,
                displayName: input.displayName,
                profileImageUrl: input.profileImageUrl,
                verified: input.verified,
                verifiedType: input.verifiedType,
              })
              .where(eq(connectedSocialAccounts.id, existing.id));
            return;
          }

          const reconnected = await tx.query.connectedSocialAccounts.findFirst({
            columns: { id: true },
            where: and(
              eq(connectedSocialAccounts.organizationId, input.organizationId),
              eq(connectedSocialAccounts.provider, input.platform),
              eq(connectedSocialAccounts.username, input.username)
            ),
          });

          if (reconnected) {
            await tx
              .update(connectedSocialAccounts)
              .set({
                providerAccountId: input.providerAccountId,
                username: input.username,
                displayName: input.displayName,
                profileImageUrl: input.profileImageUrl,
                verified: input.verified,
                verifiedType: input.verifiedType,
              })
              .where(eq(connectedSocialAccounts.id, reconnected.id));
            return;
          }

          await tx.insert(connectedSocialAccounts).values({
            id: crypto.randomUUID(),
            organizationId: input.organizationId,
            provider: input.platform,
            providerAccountId: input.providerAccountId,
            username: input.username,
            displayName: input.displayName,
            profileImageUrl: input.profileImageUrl,
            verified: input.verified,
            verifiedType: input.verifiedType,
          });
        }),
      catch: (cause) =>
        new SocialConnectCallbackError({ code: "callback_failed", cause }),
    });
  }
);

const tagProviderAccount = Effect.fn("tagProviderAccount")(function* (
  accountId: string,
  organizationId: string
) {
  yield* Effect.tryPromise({
    try: () =>
      getSocialConnectClient().socialAccounts.update(accountId, {
        external_id: organizationId,
      }),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to tag connected account",
        cause,
      }),
  }).pipe(
    Effect.catch((error) =>
      Effect.logWarning(`Failed to tag connected account: ${error.message}`)
    )
  );
});

export const disconnectProviderAccount = Effect.fn("disconnectProviderAccount")(
  function* (accountId: string) {
    if (!isSocialConnectConfigured()) {
      return;
    }

    yield* Effect.tryPromise({
      try: () => getSocialConnectClient().socialAccounts.disconnect(accountId),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to disconnect account",
          cause,
        }),
    }).pipe(
      Effect.catch((error) =>
        getSocialConnectStatusCode(error.cause) === 404
          ? Effect.void
          : Effect.fail(error)
      )
    );
  }
);
