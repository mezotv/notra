import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import {
  beginSocialConnect,
  disconnectProviderAccount,
} from "@/lib/social-connect/connect";
import { organizationIdSchema } from "@/schemas/auth/organization";
import { socialConnectPlatformSchema } from "@/schemas/social-accounts";
import {
  badRequest,
  internalServerError,
  notFound,
  serviceUnavailable,
} from "../utils/errors";

const organizationScopedInputSchema = z.object({
  organizationId: organizationIdSchema,
});

const disconnectSocialAccountInputSchema = organizationScopedInputSchema.extend(
  {
    accountId: z.string().min(1),
  }
);

const beginConnectInputSchema = organizationScopedInputSchema.extend({
  platform: socialConnectPlatformSchema,
  callbackPath: z.string().default("/"),
});

export const socialAccountsRouter = {
  list: authorizedProcedure
    .input(organizationScopedInputSchema)
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

      await db
        .delete(connectedSocialAccounts)
        .where(eq(connectedSocialAccounts.id, input.accountId));

      await Effect.runPromise(
        disconnectProviderAccount(existing.providerAccountId)
      );

      return { success: true };
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

      const result = await Effect.runPromise(
        beginSocialConnect({
          organizationId: input.organizationId,
          platform: input.platform,
          callbackPath: input.callbackPath,
          baseUrl,
        }).pipe(
          Effect.map((value) => ({
            status: "created" as const,
            url: value.url,
          })),
          Effect.catch((error) =>
            Effect.succeed(
              error._tag === "SocialConnectConfigError"
                ? { status: "config_error" as const, message: error.message }
                : { status: "failed" as const }
            )
          )
        )
      );

      if (result.status === "config_error") {
        throw serviceUnavailable(result.message);
      }
      if (result.status === "failed") {
        throw internalServerError("Failed to create account connect link");
      }

      return { url: result.url };
    }),
};
