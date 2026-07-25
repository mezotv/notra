import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts, organizations } from "@notra/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { Effect } from "effect";
import {
  getSocialConnectClient,
  isSocialConnectConfigured,
} from "@/lib/social-connect/client";
import {
  SocialConnectConfigError,
  SocialConnectRequestError,
} from "@/lib/social-connect/errors";
import type { SocialConnectPlatform } from "@/schemas/social-accounts";
import type {
  SocialConnectProfileCreateResult,
  SocialConnectProfilesListResult,
} from "@/types/services/social-connect";

const PROFILE_NAME_SUFFIX_LENGTH = 8;

export const ensureSocialConnectProfileId = Effect.fn(
  "ensureSocialConnectProfileId"
)(function* (organizationId: string, platform: SocialConnectPlatform) {
  if (!isSocialConnectConfigured()) {
    return yield* Effect.fail(
      new SocialConnectConfigError({
        message: "Social account linking is not configured",
      })
    );
  }

  const organization = yield* Effect.tryPromise({
    try: () =>
      db.query.organizations.findFirst({
        columns: { id: true, name: true, slug: true },
        where: eq(organizations.id, organizationId),
      }),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to load organization",
        cause,
      }),
  });

  if (!organization) {
    return yield* Effect.fail(
      new SocialConnectRequestError({
        message: "Organization not found",
        cause: null,
      })
    );
  }

  const accountRows = yield* Effect.tryPromise({
    try: () =>
      db.query.connectedSocialAccounts.findMany({
        columns: { provider: true, socialConnectProfileId: true },
        where: and(
          eq(connectedSocialAccounts.organizationId, organizationId),
          isNotNull(connectedSocialAccounts.socialConnectProfileId)
        ),
      }),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to load connected accounts",
        cause,
      }),
  });

  const knownProfileIds = new Set<string>();
  const occupiedProfileIds = new Set<string>();
  for (const row of accountRows) {
    if (!row.socialConnectProfileId) {
      continue;
    }
    knownProfileIds.add(row.socialConnectProfileId);
    if (row.provider === platform) {
      occupiedProfileIds.add(row.socialConnectProfileId);
    }
  }

  const client = getSocialConnectClient();

  const { data: existingProfiles } = yield* Effect.tryPromise({
    try: (): Promise<SocialConnectProfilesListResult> =>
      client.profiles.listProfiles(),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to list social connect profiles",
        cause,
      }),
  });

  const freeProfile = (existingProfiles?.profiles ?? []).find((profile) => {
    if (profile._id === undefined) {
      return false;
    }
    const belongsToOrganization =
      profile.description === organizationId ||
      profile.name === organization.slug ||
      knownProfileIds.has(profile._id);
    return belongsToOrganization && !occupiedProfileIds.has(profile._id);
  });

  let profileId = freeProfile?._id;

  if (!profileId) {
    const suffix = crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, PROFILE_NAME_SUFFIX_LENGTH);
    const { data: created } = yield* Effect.tryPromise({
      try: (): Promise<SocialConnectProfileCreateResult> =>
        client.profiles.createProfile({
          body: {
            name: `${organization.slug}-${suffix}`,
            description: organizationId,
          },
        }),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to create social connect profile",
          cause,
        }),
    });
    profileId = created?.profile?._id;
  }

  if (!profileId) {
    return yield* Effect.fail(
      new SocialConnectRequestError({
        message: "Failed to create social connect profile",
        cause: null,
      })
    );
  }

  return profileId;
});
