import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import {
  getSocialConnectClient,
  isSocialConnectConfigured,
} from "@/lib/social-connect/client";
import {
  SocialConnectConfigError,
  SocialConnectRequestError,
} from "@/lib/social-connect/errors";
import type {
  SocialConnectProfileCreateResult,
  SocialConnectProfilesListResult,
} from "@/types/services/social-connect";

export const ensureSocialConnectProfileId = Effect.fn(
  "ensureSocialConnectProfileId"
)(function* (organizationId: string) {
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
        columns: {
          id: true,
          name: true,
          slug: true,
          socialConnectProfileId: true,
        },
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

  if (organization.socialConnectProfileId) {
    return organization.socialConnectProfileId;
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

  const existingProfile = existingProfiles?.profiles?.find(
    (profile) => profile.name === organization.slug
  );

  let profileId = existingProfile?._id;

  if (!profileId) {
    const { data: created } = yield* Effect.tryPromise({
      try: (): Promise<SocialConnectProfileCreateResult> =>
        client.profiles.createProfile({
          body: { name: organization.slug, description: organization.name },
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

  yield* Effect.tryPromise({
    try: () =>
      db
        .update(organizations)
        .set({ socialConnectProfileId: profileId })
        .where(eq(organizations.id, organizationId)),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to store social connect profile id",
        cause,
      }),
  });

  return profileId;
});
