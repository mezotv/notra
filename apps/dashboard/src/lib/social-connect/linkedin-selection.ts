import { redis } from "@notra/ai/utils/redis";
import { Effect } from "effect";
import {
  getLinkedInSelectionKey,
  upsertConnectedAccount,
} from "@/lib/social-connect/connect";
import {
  SocialConnectConfigError,
  SocialConnectRequestError,
} from "@/lib/social-connect/errors";
import type { LinkedInSelectionStash } from "@/types/services/social-connect";

const parseStash = Effect.fn("parseStash")(function* (raw: unknown) {
  const stash = yield* Effect.try({
    try: (): LinkedInSelectionStash =>
      typeof raw === "string"
        ? JSON.parse(raw)
        : JSON.parse(JSON.stringify(raw)),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "The connection attempt was invalid. Please try again.",
        cause,
      }),
  });
  return stash;
});

export const getLinkedInSelection = Effect.fn("getLinkedInSelection")(
  function* (token: string) {
    const redisClient = redis;
    if (!redisClient) {
      return yield* Effect.fail(
        new SocialConnectConfigError({ message: "Redis is not configured" })
      );
    }

    const raw = yield* Effect.tryPromise({
      try: () => redisClient.get<string>(getLinkedInSelectionKey(token)),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to load the connection attempt",
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

    return yield* parseStash(raw);
  }
);

export const completeLinkedInSelection = Effect.fn("completeLinkedInSelection")(
  function* (params: { token: string; accountIds: string[] }) {
    const redisClient = redis;
    if (!redisClient) {
      return yield* Effect.fail(
        new SocialConnectConfigError({ message: "Redis is not configured" })
      );
    }

    const stash = yield* getLinkedInSelection(params.token);

    const chosen = stash.accounts.filter((account) =>
      params.accountIds.includes(account.providerAccountId)
    );

    if (chosen.length === 0) {
      return yield* Effect.fail(
        new SocialConnectRequestError({
          message: "Select at least one LinkedIn profile to connect",
          cause: null,
        })
      );
    }

    for (const account of chosen) {
      yield* upsertConnectedAccount({
        organizationId: stash.organizationId,
        platform: "linkedin",
        providerAccountId: account.providerAccountId,
        username: account.username,
        displayName: account.username,
        profileImageUrl: account.profileImageUrl,
        verified: false,
        verifiedType: null,
      }).pipe(
        Effect.catch((error) =>
          Effect.fail(
            new SocialConnectRequestError({
              message: "Failed to save the connected account",
              cause: error.cause,
            })
          )
        )
      );
    }

    yield* Effect.tryPromise({
      try: () => redisClient.del(getLinkedInSelectionKey(params.token)),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to clean up the connection attempt",
          cause,
        }),
    }).pipe(Effect.catch(() => Effect.succeed(0)));

    return { callbackPath: stash.callbackPath };
  }
);
