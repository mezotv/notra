import "server-only";

import { db } from "@notra/db/drizzle";
import { members } from "@notra/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import {
  haveIBeenPwned,
  lastLoginMethod,
  organization,
} from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { isValid as isNotDisposableEmail } from "mailchecker";
import { organizationSlugSchema } from "@/schemas/organization";

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET must be defined");
}

function validateAndNormalizeOrganizationSlug(org: {
  slug?: unknown;
  [key: string]: unknown;
}) {
  if (!org.slug || typeof org.slug !== "string") {
    throw new Error("Organization slug is required");
  }

  const validation = organizationSlugSchema.safeParse(org.slug.trim());
  if (!validation.success) {
    throw new Error(
      validation.error.issues[0]?.message ?? "Invalid organization slug"
    );
  }

  return {
    data: {
      ...org,
      slug: validation.data,
      userId: undefined,
      keepCurrentActiveOrganization: undefined,
    },
  };
}

function getTrustedOrigins() {
  return Array.from(
    new Set(
      ["http://localhost:3003", process.env.CONSOLE_BETTER_AUTH_URL].flatMap(
        (origin) => {
          if (!origin) {
            return [];
          }

          try {
            return [new URL(origin).origin];
          } catch {
            return [];
          }
        }
      )
    )
  );
}

async function getActiveOrganizationId(userId: string) {
  const membership = await db.query.members.findFirst({
    where: eq(members.userId, userId),
    columns: { organizationId: true },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  return membership?.organizationId;
}

export const auth = betterAuth({
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      organizationHooks: {
        beforeCreateOrganization: async ({ organization: newOrganization }) =>
          validateAndNormalizeOrganizationSlug(newOrganization),
        beforeUpdateOrganization: async ({
          organization: updatedOrganization,
        }) => {
          if (!updatedOrganization.slug) {
            return;
          }

          return validateAndNormalizeOrganizationSlug(updatedOrganization);
        },
      },
    }),
    lastLoginMethod(),
    haveIBeenPwned(),
    nextCookies(),
  ],
  session: {
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
    },
  },
  baseURL: process.env.CONSOLE_BETTER_AUTH_URL ?? "http://localhost:3003",
  trustedOrigins: getTrustedOrigins(),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isNotDisposableEmail(user.email)) {
            throw new APIError("BAD_REQUEST", {
              message: "Disposable email addresses are not allowed",
            });
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const activeOrganizationId = await getActiveOrganizationId(
            session.userId
          );

          if (activeOrganizationId) {
            return {
              data: {
                ...session,
                activeOrganizationId,
              },
            };
          }
        },
      },
    },
  },
});
