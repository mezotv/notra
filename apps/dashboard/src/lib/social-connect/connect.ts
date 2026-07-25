import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { SOCIAL_CONNECT_STATE_TTL_SECONDS } from "@/constants/social-connect";
import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";
import {
  getSocialConnectClient,
  isSocialConnectConfigured,
} from "@/lib/social-connect/client";
import {
  getSocialConnectStatusCode,
  SocialConnectCallbackError,
  SocialConnectConfigError,
  SocialConnectRequestError,
} from "@/lib/social-connect/errors";
import { ensureSocialConnectProfileId } from "@/lib/social-connect/profile";
import {
  type SocialConnectOAuthState,
  socialConnectOAuthStateSchema,
} from "@/schemas/social-accounts";
import type {
  BeginSocialConnectParams,
  CompleteSocialConnectParams,
  CompleteSocialConnectResult,
  SocialConnectAccountsListResult,
  SocialConnectUrlResult,
} from "@/types/services/social-connect";
import { fetchTwitterVerification } from "@/utils/twitter-fetcher";

export function getStateKey(state: string) {
  return `social_connect_oauth:${state}`;
}

export const loadSocialConnectOAuthState = Effect.fn(
  "loadSocialConnectOAuthState"
)(function* (state: string) {
  const redisClient = redis;
  if (!redisClient) {
    return yield* Effect.fail(
      new SocialConnectConfigError({ message: "Redis is not configured" })
    );
  }

  const raw = yield* Effect.tryPromise({
    try: () => redisClient.get<string>(getStateKey(state)),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to load connect state",
        cause,
      }),
  });

  if (!raw) {
    return yield* Effect.fail(
      new SocialConnectRequestError({
        message: "The connection attempt expired. Please try again.",
        cause: null,
      })
    );
  }

  const stateJson = yield* Effect.try({
    try: (): unknown => (typeof raw === "string" ? JSON.parse(raw) : raw),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "The connection attempt was invalid. Please try again.",
        cause,
      }),
  });

  const parsedState = socialConnectOAuthStateSchema.safeParse(stateJson);
  if (!parsedState.success) {
    return yield* Effect.fail(
      new SocialConnectRequestError({
        message: "The connection attempt was invalid. Please try again.",
        cause: null,
      })
    );
  }

  return parsedState.data;
});

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

  const profileId = yield* ensureSocialConnectProfileId(
    params.organizationId,
    params.platform
  );

  const state = crypto.randomUUID();
  const oauthState: SocialConnectOAuthState = {
    callbackPath: params.callbackPath,
    organizationId: params.organizationId,
    platform: params.platform,
    profileId,
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

  const { data } = yield* Effect.tryPromise({
    try: (): Promise<SocialConnectUrlResult> =>
      getSocialConnectClient().connect.getConnectUrl({
        path: { platform: params.platform },
        query: {
          profileId,
          redirect_url: `${params.baseUrl}/api/social-accounts/callback?state=${state}`,
          ...(params.platform === "linkedin" ? { headless: true } : {}),
        },
      }),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to create account connect link",
        cause,
      }),
  });

  if (!data?.authUrl) {
    return yield* Effect.fail(
      new SocialConnectRequestError({
        message: "Failed to create account connect link",
        cause: null,
      })
    );
  }

  return { url: data.authUrl };
});

export const completeSocialConnect = Effect.fn("completeSocialConnect")(
  function* (params: CompleteSocialConnectParams) {
    const redisClient = redis;
    if (!redisClient) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "invalid_callback" })
      );
    }

    const raw = yield* Effect.tryPromise({
      try: () => redisClient.get<string>(getStateKey(params.state)),
      catch: (cause) =>
        new SocialConnectCallbackError({ code: "expired_state", cause }),
    });

    if (!raw) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "expired_state" })
      );
    }

    yield* Effect.tryPromise({
      try: () => redisClient.del(getStateKey(params.state)),
      catch: (cause) =>
        new SocialConnectCallbackError({ code: "callback_failed", cause }),
    });

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
    const oauthState = parsedState.data;

    if (params.error) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: params.error })
      );
    }

    const accountId = params.accountId;
    if (!accountId) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "connection_failed" })
      );
    }

    if (!isSocialConnectConfigured()) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "callback_failed" })
      );
    }

    const { data } = yield* Effect.tryPromise({
      try: (): Promise<SocialConnectAccountsListResult> =>
        getSocialConnectClient().accounts.listAccounts({
          query: {
            platform: oauthState.platform,
            profileId: oauthState.profileId,
          },
        }),
      catch: (cause) =>
        new SocialConnectCallbackError({ code: "account_fetch_failed", cause }),
    });

    const providerAccount = data?.accounts.find(
      (account) => account._id === accountId
    );

    const username = providerAccount?.username ?? params.username;
    if (!username) {
      return yield* Effect.fail(
        new SocialConnectCallbackError({ code: "account_fetch_failed" })
      );
    }

    const displayName = providerAccount?.displayName ?? username;
    const rawProfileImageUrl = providerAccount?.profilePicture ?? null;
    const profileImageUrl =
      rawProfileImageUrl && oauthState.platform === "twitter"
        ? normalizeTwitterProfileImageUrl(rawProfileImageUrl)
        : rawProfileImageUrl;

    let verifiedType =
      providerAccount?.metadata?.profileData?.extraData?.verifiedType ?? null;
    if (oauthState.platform === "twitter") {
      const verification = yield* fetchTwitterVerification(username).pipe(
        Effect.catch(() => Effect.succeed(null))
      );
      verifiedType = verification?.verifiedType ?? verifiedType;
    }
    const verified = verifiedType !== null && verifiedType !== "none";

    const { replacedProviderAccountId } = yield* Effect.tryPromise({
      try: async (): Promise<{ replacedProviderAccountId: string | null }> => {
        const existing = await db.query.connectedSocialAccounts.findFirst({
          columns: { id: true },
          where: and(
            eq(
              connectedSocialAccounts.organizationId,
              oauthState.organizationId
            ),
            eq(connectedSocialAccounts.provider, oauthState.platform),
            eq(connectedSocialAccounts.providerAccountId, accountId)
          ),
        });

        if (existing) {
          await db
            .update(connectedSocialAccounts)
            .set({
              username,
              displayName,
              profileImageUrl,
              verified,
              verifiedType,
              socialConnectProfileId: oauthState.profileId,
            })
            .where(eq(connectedSocialAccounts.id, existing.id));
          return { replacedProviderAccountId: null };
        }

        const reconnected = await db.query.connectedSocialAccounts.findFirst({
          columns: { id: true, providerAccountId: true },
          where: and(
            eq(
              connectedSocialAccounts.organizationId,
              oauthState.organizationId
            ),
            eq(connectedSocialAccounts.provider, oauthState.platform),
            eq(connectedSocialAccounts.username, username)
          ),
        });

        if (reconnected) {
          await db
            .update(connectedSocialAccounts)
            .set({
              providerAccountId: accountId,
              username,
              displayName,
              profileImageUrl,
              verified,
              verifiedType,
              socialConnectProfileId: oauthState.profileId,
            })
            .where(eq(connectedSocialAccounts.id, reconnected.id));
          return { replacedProviderAccountId: reconnected.providerAccountId };
        }

        await db.insert(connectedSocialAccounts).values({
          id: crypto.randomUUID(),
          organizationId: oauthState.organizationId,
          provider: oauthState.platform,
          providerAccountId: accountId,
          socialConnectProfileId: oauthState.profileId,
          username,
          displayName,
          profileImageUrl,
          verified,
          verifiedType,
        });
        return { replacedProviderAccountId: null };
      },
      catch: (cause) =>
        new SocialConnectCallbackError({ code: "callback_failed", cause }),
    });

    if (replacedProviderAccountId && replacedProviderAccountId !== accountId) {
      yield* disconnectProviderAccount(replacedProviderAccountId).pipe(
        Effect.catch((error) =>
          Effect.logWarning(
            `Failed to remove replaced account at provider: ${error.message}`
          )
        )
      );
    }

    const result: CompleteSocialConnectResult = {
      callbackPath: oauthState.callbackPath,
      platform: oauthState.platform,
    };
    return result;
  }
);

export const disconnectProviderAccount = Effect.fn("disconnectProviderAccount")(
  function* (accountId: string) {
    if (!isSocialConnectConfigured()) {
      return;
    }

    yield* Effect.tryPromise({
      try: () =>
        getSocialConnectClient().accounts.deleteAccount({
          path: { accountId },
        }),
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
