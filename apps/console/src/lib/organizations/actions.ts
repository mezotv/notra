"use server";

import { autumn } from "@notra/ai/billing/autumn";
import { seedSystemSkills } from "@notra/ai/skills/seed";
import { db } from "@notra/db/drizzle";
import { members, organizations } from "@notra/db/schema";
import { desc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { cookies } from "next/headers";

import { LAST_VISITED_ORGANIZATION_COOKIE } from "@/constants/cookies";
import { OrganizationActionError } from "@/lib/organizations/errors";
import { requireMembership, requireSession } from "@/lib/organizations/guards";
import { runOrganizationAction } from "@/lib/organizations/run-action";
import { ensureWorkOSOrganizationWithMembers } from "@/lib/organizations/workos-sync";
import { organizationSlugSchema } from "@/schemas/organization";
import type {
  ActionResult,
  CreateOrganizationInput,
  OrganizationRow,
  SetActiveOrganizationInput,
} from "@/types/organization";

const validateSlug = Effect.fn("organizations.actions.validateSlug")(function* (
  rawSlug: string
) {
  const validation = organizationSlugSchema.safeParse(rawSlug.trim());

  if (!validation.success) {
    return yield* Effect.fail(
      new OrganizationActionError({
        message:
          validation.error.issues[0]?.message ?? "Invalid organization slug",
      })
    );
  }

  return validation.data;
});

const tryDb = <T>(run: () => Promise<T>, message: string) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new OrganizationActionError({ message, cause }),
  });

export async function createOrganizationAction(
  input: CreateOrganizationInput
): Promise<ActionResult<OrganizationRow>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();
      const slug = yield* validateSlug(input.slug);

      const existing = yield* tryDb(
        () =>
          db.query.organizations.findFirst({
            where: eq(organizations.slug, slug),
            columns: { id: true },
          }),
        "Failed to check organization slug"
      );

      if (existing) {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "An organization with this slug already exists",
          })
        );
      }

      const organizationId = crypto.randomUUID();
      const now = new Date();

      const [organization] = yield* tryDb(
        () =>
          db.transaction(async (tx) => {
            const inserted = await tx
              .insert(organizations)
              .values({
                id: organizationId,
                name: input.name,
                slug,
                logo: input.logo ?? null,
                createdAt: now,
              })
              .returning();

            await tx.insert(members).values({
              id: crypto.randomUUID(),
              organizationId,
              userId: session.user.id,
              role: "owner",
              createdAt: now,
            });

            return inserted;
          }),
        "Failed to create organization"
      );

      if (!organization) {
        return yield* Effect.fail(
          new OrganizationActionError({
            message: "Organization creation returned no row",
          })
        );
      }

      yield* ensureWorkOSOrganizationWithMembers(organizationId).pipe(
        Effect.catch((error) =>
          tryDb(
            () =>
              db
                .delete(organizations)
                .where(eq(organizations.id, organizationId)),
            "Failed to roll back organization"
          ).pipe(
            Effect.andThen(
              Effect.fail(
                new OrganizationActionError({
                  message: "Failed to link organization to WorkOS",
                  cause: error,
                })
              )
            )
          )
        )
      );

      yield* Effect.tryPromise({
        try: () => seedSystemSkills(organizationId),
        catch: (cause) =>
          new OrganizationActionError({
            message: "Failed to seed system skills",
            cause,
          }),
      }).pipe(
        Effect.catch((error) =>
          Effect.logWarning("Failed to seed system skills for new org").pipe(
            Effect.annotateLogs({ organizationId, error: error.message })
          )
        )
      );

      const autumnClient = autumn;
      if (autumnClient) {
        yield* Effect.tryPromise({
          try: () =>
            autumnClient.customers.getOrCreate({
              customerId: organizationId,
              name: input.name,
              metadata: { orgId: organizationId },
            }),
          catch: (cause) =>
            new OrganizationActionError({
              message: "Failed to create billing customer",
              cause,
            }),
        }).pipe(
          Effect.catch((error) =>
            Effect.logWarning("Failed to create Autumn customer").pipe(
              Effect.annotateLogs({ organizationId, error: error.message })
            )
          )
        );
      }

      if (!input.keepCurrentActiveOrganization) {
        const cookieStore = yield* tryDb(
          () => cookies(),
          "Failed to access cookies"
        );
        cookieStore.set(LAST_VISITED_ORGANIZATION_COOKIE, slug, { path: "/" });
      }

      return organization;
    })
  );
}

export async function listOrganizationsAction(): Promise<
  ActionResult<OrganizationRow[]>
> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      const rows = yield* tryDb(
        () =>
          db.query.members.findMany({
            where: eq(members.userId, session.user.id),
            orderBy: [desc(members.createdAt)],
            with: { organizations: true },
          }),
        "Failed to list organizations"
      );

      return rows.flatMap((row) =>
        row.organizations ? [row.organizations] : []
      );
    })
  );
}

function findOrganizationForSelection(input: SetActiveOrganizationInput) {
  if (input.organizationId) {
    return db.query.organizations.findFirst({
      where: eq(organizations.id, input.organizationId),
    });
  }

  if (input.organizationSlug) {
    return db.query.organizations.findFirst({
      where: eq(organizations.slug, input.organizationSlug),
    });
  }

  return Promise.resolve(undefined);
}

export async function setActiveOrganizationAction(
  input: SetActiveOrganizationInput
): Promise<ActionResult<OrganizationRow>> {
  return runOrganizationAction(
    Effect.gen(function* () {
      const session = yield* requireSession();

      const organization = yield* tryDb(
        () => findOrganizationForSelection(input),
        "Failed to load organization"
      );

      if (!organization) {
        return yield* Effect.fail(
          new OrganizationActionError({ message: "Organization not found" })
        );
      }

      yield* requireMembership(session, organization.id);

      const cookieStore = yield* tryDb(
        () => cookies(),
        "Failed to access cookies"
      );
      cookieStore.set(LAST_VISITED_ORGANIZATION_COOKIE, organization.slug, {
        path: "/",
      });

      return organization;
    })
  );
}
