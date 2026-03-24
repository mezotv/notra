import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import { redis } from "@/lib/redis";
import { organizationIdSchema } from "@/schemas/auth/organization";
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

const beginTwitterAuthInputSchema = organizationScopedInputSchema.extend({
  callbackPath: z.string().default("/"),
});

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

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
        columns: { id: true },
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

      return { success: true };
    }),
  twitter: {
    beginAuth: authorizedProcedure
      .input(beginTwitterAuthInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        const clientId = process.env.TWITTER_CLIENT_ID;
        if (!clientId) {
          throw internalServerError("Twitter OAuth is not configured");
        }

        if (!redis) {
          throw serviceUnavailable("Redis is not configured");
        }

        const baseUrl =
          process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
        if (!baseUrl) {
          throw badRequest("Application base URL is not configured");
        }

        const state = crypto.randomUUID();
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const redirectUri = `${baseUrl}/api/social-accounts/twitter/callback`;

        await redis.set(
          `twitter_oauth:${state}`,
          JSON.stringify({
            callbackPath: input.callbackPath,
            codeVerifier,
            organizationId: input.organizationId,
          }),
          { ex: 600 }
        );

        const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set(
          "scope",
          "tweet.read tweet.write users.read offline.access"
        );
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("code_challenge", codeChallenge);
        authUrl.searchParams.set("code_challenge_method", "S256");

        return { url: authUrl.toString() };
      }),
  },
};
