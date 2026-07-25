import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";
import {
  getSocialConnectClient,
  isSocialConnectConfigured,
} from "@/lib/social-connect/client";
import {
  SocialConnectConfigError,
  SocialConnectRequestError,
} from "@/lib/social-connect/errors";
import type {
  RefreshedAccountStatus,
  SocialConnectAccountSummary,
  SocialConnectAccountsListResult,
} from "@/types/services/social-connect";
import { fetchTwitterVerification } from "@/utils/twitter-fetcher";

export const refreshConnectedAccounts = Effect.fn("refreshConnectedAccounts")(
  function* (organizationId: string, accountId?: string) {
    if (!isSocialConnectConfigured()) {
      return yield* Effect.fail(
        new SocialConnectConfigError({
          message: "Social account linking is not configured",
        })
      );
    }

    const rows = yield* Effect.tryPromise({
      try: () =>
        db.query.connectedSocialAccounts.findMany({
          where: accountId
            ? and(
                eq(connectedSocialAccounts.organizationId, organizationId),
                eq(connectedSocialAccounts.id, accountId)
              )
            : eq(connectedSocialAccounts.organizationId, organizationId),
        }),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to load connected accounts",
          cause,
        }),
    });

    if (accountId && rows.length === 0) {
      return yield* Effect.fail(
        new SocialConnectRequestError({
          message: "Account not found",
          cause: null,
        })
      );
    }

    const client = getSocialConnectClient();
    const profileIds = [
      ...new Set(
        rows
          .map((row) => row.socialConnectProfileId)
          .filter((id): id is string => id !== null)
      ),
    ];

    const accountsByProfile = new Map<string, SocialConnectAccountSummary[]>();
    for (const profileId of profileIds) {
      const { data } = yield* Effect.tryPromise({
        try: (): Promise<SocialConnectAccountsListResult> =>
          client.accounts.listAccounts({ query: { profileId } }),
        catch: (cause) =>
          new SocialConnectRequestError({
            message: "Failed to load accounts from provider",
            cause,
          }),
      });
      accountsByProfile.set(profileId, data?.accounts ?? []);
    }

    const results: RefreshedAccountStatus[] = [];

    for (const row of rows) {
      const providerAccounts = row.socialConnectProfileId
        ? (accountsByProfile.get(row.socialConnectProfileId) ?? [])
        : [];
      const match =
        providerAccounts.find(
          (account) => account._id === row.providerAccountId
        ) ??
        providerAccounts.find(
          (account) =>
            account.platform === row.provider &&
            account.username === row.username
        );

      if (!match) {
        results.push({ username: row.username, status: "missing" });
        continue;
      }

      const username = match.username ?? row.username;
      const displayName = match.displayName ?? username;
      const rawProfileImageUrl = match.profilePicture ?? row.profileImageUrl;
      const profileImageUrl =
        rawProfileImageUrl && row.provider === "twitter"
          ? normalizeTwitterProfileImageUrl(rawProfileImageUrl)
          : rawProfileImageUrl;

      let verifiedType =
        match.metadata?.profileData?.extraData?.verifiedType ??
        row.verifiedType;
      if (row.provider === "twitter") {
        const verification = yield* fetchTwitterVerification(username).pipe(
          Effect.catch(() => Effect.succeed(null))
        );
        verifiedType = verification?.verifiedType ?? verifiedType;
      }
      const verified = verifiedType !== null && verifiedType !== "none";

      yield* Effect.tryPromise({
        try: () =>
          db
            .update(connectedSocialAccounts)
            .set({
              providerAccountId: match._id,
              username,
              displayName,
              profileImageUrl,
              verified,
              verifiedType,
            })
            .where(eq(connectedSocialAccounts.id, row.id)),
        catch: (cause) =>
          new SocialConnectRequestError({
            message: "Failed to update connected account",
            cause,
          }),
      });

      results.push({ username, status: "updated" });
    }

    return { accounts: results };
  }
);
