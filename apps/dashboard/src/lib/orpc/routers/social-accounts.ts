import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import { runSocialConnect } from "@/lib/orpc/utils/social-connect";
import {
  beginSocialConnect,
  disconnectProviderAccount,
} from "@/lib/social-connect/connect";
import { publishSocialPost } from "@/lib/social-connect/publish";
import { refreshConnectedAccounts } from "@/lib/social-connect/refresh";
import {
  beginConnectInputSchema,
  disconnectSocialAccountInputSchema,
  publishSocialPostInputSchema,
  refreshSocialAccountsInputSchema,
  socialAccountsOrganizationInputSchema,
} from "@/schemas/social-accounts";
import { notFound } from "../utils/errors";

export const socialAccountsRouter = {
  list: authorizedProcedure
    .input(socialAccountsOrganizationInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const accounts = await db.query.connectedSocialAccounts.findMany({
        columns: {
          createdAt: true,
          displayName: true,
          id: true,
          profileImageUrl: true,
          provider: true,
          providerAccountId: true,
          username: true,
          verified: true,
          verifiedType: true,
        },
        where: eq(connectedSocialAccounts.organizationId, input.organizationId),
      });

      return {
        accounts: accounts.map((account) => ({
          ...account,
          createdAt: account.createdAt.toISOString(),
        })),
      };
    }),
  disconnect: authorizedProcedure
    .input(disconnectSocialAccountInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const existing = await db.query.connectedSocialAccounts.findFirst({
        columns: { id: true, providerAccountId: true },
        where: and(
          eq(connectedSocialAccounts.id, input.accountId),
          eq(connectedSocialAccounts.organizationId, input.organizationId)
        ),
      });

      if (!existing) {
        throw notFound("Account not found");
      }

      await runSocialConnect(
        disconnectProviderAccount(existing.providerAccountId).pipe(
          Effect.map(() => undefined)
        ),
        { logLabel: "Failed to disconnect account" }
      );

      await db
        .delete(connectedSocialAccounts)
        .where(eq(connectedSocialAccounts.id, input.accountId));

      return { success: true };
    }),
  refresh: authorizedProcedure
    .input(refreshSocialAccountsInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const result = await runSocialConnect(
        refreshConnectedAccounts(input.organizationId, input.accountId),
        { logLabel: "Failed to refresh connected accounts" }
      );

      return { accounts: result.accounts };
    }),
  publish: authorizedProcedure
    .input(publishSocialPostInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const result = await runSocialConnect(
        publishSocialPost({
          organizationId: input.organizationId,
          accountId: input.accountId,
          content: input.content,
        }),
        { logLabel: "Failed to publish post", reconnectHint: true }
      );

      return {
        postId: result.postId,
        platformPostId: result.platformPostId,
        postUrl: result.postUrl,
        username: result.username,
      };
    }),
  beginConnect: authorizedProcedure
    .input(beginConnectInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const result = await runSocialConnect(
        beginSocialConnect({
          organizationId: input.organizationId,
          platform: input.platform,
          callbackPath: input.callbackPath,
        }),
        { logLabel: "Failed to create account connect link" }
      );

      return { url: result.url };
    }),
};
