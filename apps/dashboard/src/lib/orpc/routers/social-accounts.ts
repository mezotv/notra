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
  loadSocialConnectOAuthState,
} from "@/lib/social-connect/connect";
import {
  completeLinkedInSelection,
  getLinkedInSelection,
} from "@/lib/social-connect/linkedin-selection";
import { publishSocialPost } from "@/lib/social-connect/publish";
import { refreshConnectedAccounts } from "@/lib/social-connect/refresh";
import {
  beginConnectInputSchema,
  disconnectSocialAccountInputSchema,
  linkedinSelectionCompleteInputSchema,
  linkedinSelectionGetInputSchema,
  publishSocialPostInputSchema,
  refreshSocialAccountsInputSchema,
  socialAccountsOrganizationInputSchema,
} from "@/schemas/social-accounts";
import { badRequest, notFound } from "../utils/errors";

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
  linkedinSelectionGet: authorizedProcedure
    .input(linkedinSelectionGetInputSchema)
    .handler(async ({ context, input }) => {
      const oauthState = await runSocialConnect(
        loadSocialConnectOAuthState(input.state),
        { logLabel: "Failed to load connect state" }
      );

      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: oauthState.organizationId,
        user: context.user,
      });

      if (oauthState.platform !== "linkedin") {
        throw badRequest("This connection attempt is not for LinkedIn");
      }

      const options = await runSocialConnect(
        getLinkedInSelection({
          oauthState,
          state: input.state,
          token: input.token,
        }),
        { logLabel: "Failed to load LinkedIn selection" }
      );

      return {
        options,
        organizationId: oauthState.organizationId,
        callbackPath: oauthState.callbackPath,
      };
    }),
  linkedinSelectionComplete: authorizedProcedure
    .input(linkedinSelectionCompleteInputSchema)
    .handler(async ({ context, input }) => {
      const oauthState = await runSocialConnect(
        loadSocialConnectOAuthState(input.state),
        { logLabel: "Failed to load connect state" }
      );

      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: oauthState.organizationId,
        user: context.user,
      });

      if (oauthState.platform !== "linkedin") {
        throw badRequest("This connection attempt is not for LinkedIn");
      }

      const result = await runSocialConnect(
        completeLinkedInSelection({
          oauthState,
          state: input.state,
          accountType: input.accountType,
          organizationId: input.organizationId,
        }),
        { logLabel: "Failed to complete LinkedIn connection" }
      );

      return { callbackPath: result.callbackPath };
    }),
  beginConnect: authorizedProcedure
    .input(beginConnectInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const baseUrl =
        process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
      if (!baseUrl) {
        throw badRequest("Application base URL is not configured");
      }

      const result = await runSocialConnect(
        beginSocialConnect({
          organizationId: input.organizationId,
          platform: input.platform,
          callbackPath: input.callbackPath,
          baseUrl,
        }),
        { logLabel: "Failed to create account connect link" }
      );

      return { url: result.url };
    }),
};
