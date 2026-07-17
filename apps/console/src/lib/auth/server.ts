import "server-only";

import { autumn } from "@notra/ai/billing/autumn";
import { seedSystemSkills } from "@notra/ai/skills/seed";
import { redis } from "@notra/ai/utils/redis";
import { db } from "@notra/db/drizzle";
import { members, users } from "@notra/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  haveIBeenPwned,
  lastLoginMethod,
  organization,
} from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { isValid as isNotDisposableEmail } from "mailchecker";
import { assertImpersonationTargetAllowed } from "@/lib/auth/impersonation";
import { hasAdminRole } from "@/lib/auth/role";
import { enforceTeamMembersLimit } from "@/lib/billing/team-members";
import { organizationSlugSchema } from "@/schemas/organization";

function buildSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> =
    {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }

  if (Object.keys(providers).length === 0) {
    return undefined;
  }

  return providers;
}

const socialProviders = buildSocialProviders();

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) {
  throw new Error("BETTER_AUTH_SECRET must be defined");
}

const isProduction = process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const appUrl =
  process.env.CONSOLE_BETTER_AUTH_URL ??
  (isProduction ? undefined : "http://localhost:3003");

if (isProduction && !(appUrl || isBuildPhase)) {
  throw new Error(
    "CONSOLE_BETTER_AUTH_URL must be defined in production. Without it, auth requests fail better-auth's trusted-origin checks"
  );
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
    onPasswordReset: async ({ user }) => {
      const { internalAdapter } = await auth.$context;
      await internalAdapter.deleteUserSessions(user.id);
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/admin/impersonate-user") {
        return;
      }

      const userId = ctx.body?.userId;
      if (typeof userId !== "string") {
        return;
      }

      const session = await getSessionFromCtx(ctx);
      const actorRole = session?.user.role;
      if (!(session && hasAdminRole(actorRole))) {
        return;
      }

      const target = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          role: true,
          banned: true,
        },
      });

      if (target) {
        assertImpersonationTargetAllowed({
          actorUserId: session.user.id,
          target,
        });
      }
    }),
  },
  plugins: [
    admin(),
    organization({
      organizationHooks: {
        beforeCreateOrganization: async ({ organization: newOrganization }) =>
          validateAndNormalizeOrganizationSlug(newOrganization),
        afterCreateOrganization: async ({
          organization: createdOrganization,
        }) => {
          try {
            await seedSystemSkills(createdOrganization.id);
          } catch (error) {
            console.error(
              "[Skills] Failed to seed system skills for new org:",
              {
                organizationId: createdOrganization.id,
                error,
              }
            );
          }

          if (!autumn) {
            console.warn(
              "[Autumn] Skipping customer creation - AUTUMN_SECRET_KEY not configured"
            );
            return;
          }

          try {
            await autumn.customers.getOrCreate({
              customerId: createdOrganization.id,
              name: createdOrganization.name,
              metadata: {
                orgId: createdOrganization.id,
              },
            });
          } catch (error) {
            console.error("[Autumn] Failed to create customer for new org:", {
              organizationId: createdOrganization.id,
              error,
            });
          }
        },
        beforeCreateInvitation: async ({ invitation, organization: org }) => {
          if (!isNotDisposableEmail(invitation.email)) {
            throw new APIError("BAD_REQUEST", {
              message: "Disposable email addresses are not allowed",
            });
          }

          await enforceTeamMembersLimit(org.id);
        },
        beforeAddMember: async ({ organization: org }) => {
          const [result] = await db
            .select({ value: count() })
            .from(members)
            .where(eq(members.organizationId, org.id));

          if (result && result.value > 0) {
            await enforceTeamMembersLimit(org.id);
          }
        },
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
  secondaryStorage: redis
    ? {
        get: async (key) => await redis?.get(key),
        set: async (key, value, ttl) => {
          if (ttl) {
            await redis?.set(key, value, { ex: ttl });
          } else {
            await redis?.set(key, value);
          }
        },
        delete: async (key) => {
          await redis?.del(key);
        },
      }
    : undefined,
  session: {
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: redis ? "secondary-storage" : "memory",
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/forget-password": {
        window: 60,
        max: 3,
      },
      "/reset-password/*": {
        window: 60,
        max: 5,
      },
    },
  },
  baseURL: appUrl,
  trustedOrigins: getTrustedOrigins(),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: Object.keys(socialProviders ?? {}),
      allowDifferentEmails: true,
    },
  },
  ...(socialProviders && { socialProviders }),
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
