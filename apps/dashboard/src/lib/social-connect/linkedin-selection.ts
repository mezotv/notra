import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { SOCIAL_CONNECT_STATE_TTL_SECONDS } from "@/constants/social-connect";
import {
  getSocialConnectClient,
  isSocialConnectConfigured,
} from "@/lib/social-connect/client";
import { getStateKey } from "@/lib/social-connect/connect";
import {
  SocialConnectConfigError,
  SocialConnectRequestError,
} from "@/lib/social-connect/errors";
import type { SocialConnectOAuthState } from "@/schemas/social-accounts";
import type {
  LinkedInPendingOrganization,
  LinkedInSelectionCache,
  LinkedInSelectionOptions,
  SocialConnectLinkedInOrgsResult,
  SocialConnectLinkedInSelectResult,
  SocialConnectPendingOAuthResult,
} from "@/types/services/social-connect";

function getSelectionKey(state: string) {
  return `social_connect_linkedin_selection:${state}`;
}

function readProfileText(
  userProfile: Record<string, unknown>,
  key: string
): string | null {
  const value = userProfile[key];
  return typeof value === "string" && value ? value : null;
}

const loadSelectionCache = Effect.fn("loadSelectionCache")(function* (
  state: string
) {
  const redisClient = redis;
  if (!redisClient) {
    return null;
  }
  const raw = yield* Effect.tryPromise({
    try: () => redisClient.get<string>(getSelectionKey(state)),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to load connection data",
        cause,
      }),
  });
  if (!raw) {
    return null;
  }
  return yield* Effect.try({
    try: (): LinkedInSelectionCache =>
      typeof raw === "string" ? JSON.parse(raw) : raw,
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to load connection data",
        cause,
      }),
  });
});

function toSelectionOptions(
  cache: LinkedInSelectionCache
): LinkedInSelectionOptions {
  return {
    personal: {
      displayName:
        readProfileText(cache.userProfile, "displayName") ??
        readProfileText(cache.userProfile, "username") ??
        "Personal profile",
      profilePicture: readProfileText(cache.userProfile, "profilePicture"),
    },
    organizations: cache.organizations
      .filter(
        (
          organization
        ): organization is LinkedInPendingOrganization & {
          id: string;
        } => Boolean(organization.id)
      )
      .map((organization) => ({
        id: organization.id,
        name: organization.name ?? organization.vanityName ?? "Organization",
        vanityName: organization.vanityName ?? null,
        logoUrl: organization.logoUrl ?? null,
      })),
  };
}

export const getLinkedInSelection = Effect.fn("getLinkedInSelection")(
  function* (params: {
    oauthState: SocialConnectOAuthState;
    state: string;
    token: string;
  }) {
    if (!isSocialConnectConfigured()) {
      return yield* Effect.fail(
        new SocialConnectConfigError({
          message: "Social account linking is not configured",
        })
      );
    }

    const cached = yield* loadSelectionCache(params.state);
    if (cached) {
      return toSelectionOptions(cached);
    }

    const redisClient = redis;
    if (!redisClient) {
      return yield* Effect.fail(
        new SocialConnectConfigError({ message: "Redis is not configured" })
      );
    }

    const client = getSocialConnectClient();

    const { data: pending } = yield* Effect.tryPromise({
      try: (): Promise<SocialConnectPendingOAuthResult> =>
        client.connect.getPendingOAuthData({
          query: { token: params.token },
        }),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "The connection attempt expired. Please try again.",
          cause,
        }),
    });

    const tempToken = pending?.tempToken;
    const userProfile = pending?.userProfile;
    if (!(tempToken && userProfile)) {
      return yield* Effect.fail(
        new SocialConnectRequestError({
          message: "The connection attempt expired. Please try again.",
          cause: null,
        })
      );
    }

    let organizations = pending?.organizations ?? [];
    const orgIds = organizations
      .map((organization) => organization.id)
      .filter((id): id is string => Boolean(id));

    if (orgIds.length > 0) {
      const enriched = yield* Effect.tryPromise({
        try: (): Promise<SocialConnectLinkedInOrgsResult> =>
          client.connect.linkedin.listLinkedInOrganizations({
            query: { orgIds: orgIds.join(","), tempToken },
          }),
        catch: (cause) =>
          new SocialConnectRequestError({
            message: "Failed to load LinkedIn pages",
            cause,
          }),
      }).pipe(Effect.catch(() => Effect.succeed(null)));

      const detailsById = new Map(
        (enriched?.data?.organizations ?? [])
          .filter((organization) => organization.id !== undefined)
          .map((organization) => [organization.id, organization])
      );
      organizations = organizations.map((organization) => ({
        ...organization,
        logoUrl: organization.id
          ? (detailsById.get(organization.id)?.logoUrl ?? undefined)
          : undefined,
      }));
    }

    const cache: LinkedInSelectionCache = {
      tempToken,
      userProfile,
      organizations,
    };

    yield* Effect.tryPromise({
      try: () =>
        redisClient.set(getSelectionKey(params.state), JSON.stringify(cache), {
          ex: SOCIAL_CONNECT_STATE_TTL_SECONDS,
        }),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to store connection data",
          cause,
        }),
    });

    return toSelectionOptions(cache);
  }
);

export const completeLinkedInSelection = Effect.fn("completeLinkedInSelection")(
  function* (params: {
    oauthState: SocialConnectOAuthState;
    state: string;
    accountType: "personal" | "organization";
    organizationId?: string;
  }) {
    if (!isSocialConnectConfigured()) {
      return yield* Effect.fail(
        new SocialConnectConfigError({
          message: "Social account linking is not configured",
        })
      );
    }

    const cache = yield* loadSelectionCache(params.state);
    if (!cache) {
      return yield* Effect.fail(
        new SocialConnectRequestError({
          message: "The connection attempt expired. Please try again.",
          cause: null,
        })
      );
    }

    const selectedOrganization =
      params.accountType === "organization"
        ? cache.organizations.find(
            (organization) => organization.id === params.organizationId
          )
        : undefined;

    if (params.accountType === "organization" && !selectedOrganization) {
      return yield* Effect.fail(
        new SocialConnectRequestError({
          message: "The selected LinkedIn page was not found",
          cause: null,
        })
      );
    }

    const { data } = yield* Effect.tryPromise({
      try: (): Promise<SocialConnectLinkedInSelectResult> =>
        getSocialConnectClient().connect.linkedin.selectLinkedInOrganization({
          body: {
            profileId: params.oauthState.profileId,
            tempToken: cache.tempToken,
            userProfile: cache.userProfile,
            accountType: params.accountType,
            ...(selectedOrganization ? { selectedOrganization } : {}),
          },
        }),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to connect the LinkedIn account",
          cause,
        }),
    });

    const account = data?.account;
    const providerAccountId = account?.accountId;
    const username =
      account?.username ??
      (params.accountType === "organization"
        ? (selectedOrganization?.vanityName ?? selectedOrganization?.name)
        : readProfileText(cache.userProfile, "username"));

    if (!(providerAccountId && username)) {
      return yield* Effect.fail(
        new SocialConnectRequestError({
          message: "Failed to connect the LinkedIn account",
          cause: null,
        })
      );
    }

    const displayName = account?.displayName ?? username;
    const profileImageUrl = account?.profilePicture ?? null;

    yield* Effect.tryPromise({
      try: async () => {
        const existing = await db.query.connectedSocialAccounts.findFirst({
          columns: { id: true },
          where: and(
            eq(
              connectedSocialAccounts.organizationId,
              params.oauthState.organizationId
            ),
            eq(connectedSocialAccounts.provider, "linkedin"),
            eq(connectedSocialAccounts.providerAccountId, providerAccountId)
          ),
        });

        if (existing) {
          await db
            .update(connectedSocialAccounts)
            .set({
              username,
              displayName,
              profileImageUrl,
              socialConnectProfileId: params.oauthState.profileId,
            })
            .where(eq(connectedSocialAccounts.id, existing.id));
          return;
        }

        const reconnected = await db.query.connectedSocialAccounts.findFirst({
          columns: { id: true },
          where: and(
            eq(
              connectedSocialAccounts.organizationId,
              params.oauthState.organizationId
            ),
            eq(connectedSocialAccounts.provider, "linkedin"),
            eq(connectedSocialAccounts.username, username)
          ),
        });

        if (reconnected) {
          await db
            .update(connectedSocialAccounts)
            .set({
              providerAccountId,
              username,
              displayName,
              profileImageUrl,
              socialConnectProfileId: params.oauthState.profileId,
            })
            .where(eq(connectedSocialAccounts.id, reconnected.id));
          return;
        }

        await db.insert(connectedSocialAccounts).values({
          id: crypto.randomUUID(),
          organizationId: params.oauthState.organizationId,
          provider: "linkedin",
          providerAccountId,
          socialConnectProfileId: params.oauthState.profileId,
          username,
          displayName,
          profileImageUrl,
        });
      },
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to save the connected account",
          cause,
        }),
    });

    const redisClient = redis;
    if (redisClient) {
      yield* Effect.tryPromise({
        try: () =>
          Promise.all([
            redisClient.del(getStateKey(params.state)),
            redisClient.del(getSelectionKey(params.state)),
          ]),
        catch: (cause) =>
          new SocialConnectRequestError({
            message: "Failed to clean up connection state",
            cause,
          }),
      }).pipe(Effect.catch(() => Effect.succeed(null)));
    }

    return { callbackPath: params.oauthState.callbackPath };
  }
);
