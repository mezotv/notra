import { db } from "@notra/db/drizzle";
import { members, organizations, users } from "@notra/db/schema";
import type { OrganizationMembership } from "@workos-inc/node";
import { and, eq } from "drizzle-orm";
import { Data, Effect } from "effect";

class WebhookSyncError extends Data.TaggedError("WebhookSyncError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const resolveLocalIds = Effect.fn("auth.webhook.resolveLocalIds")(function* (
  membership: OrganizationMembership
) {
  const [organization, user] = yield* Effect.tryPromise({
    try: () =>
      Promise.all([
        db.query.organizations.findFirst({
          where: eq(organizations.workosOrgId, membership.organizationId),
          columns: { id: true },
        }),
        db.query.users.findFirst({
          where: eq(users.workosUserId, membership.userId),
          columns: { id: true },
        }),
      ]),
    catch: (cause) =>
      new WebhookSyncError({ message: "Failed to resolve local ids", cause }),
  });

  return {
    organizationId: organization?.id ?? null,
    userId: user?.id ?? null,
  };
});

export const upsertMembershipFromWebhook = Effect.fn(
  "auth.webhook.upsertMembership"
)(function* (membership: OrganizationMembership) {
  const { organizationId, userId } = yield* resolveLocalIds(membership);

  if (!(organizationId && userId)) {
    yield* Effect.logInfo("Skipping membership webhook - unmapped ids").pipe(
      Effect.annotateLogs({
        workosOrgId: membership.organizationId,
        workosUserId: membership.userId,
      })
    );
    return;
  }

  const role = membership.role.slug || "member";

  yield* Effect.tryPromise({
    try: async () => {
      const existing = await db.query.members.findFirst({
        where: and(
          eq(members.userId, userId),
          eq(members.organizationId, organizationId)
        ),
        columns: { id: true, role: true },
      });

      if (!existing) {
        await db.insert(members).values({
          id: crypto.randomUUID(),
          organizationId,
          userId,
          role,
          createdAt: new Date(membership.createdAt),
        });
        return;
      }

      if (existing.role !== role && existing.role !== "owner") {
        await db
          .update(members)
          .set({ role })
          .where(eq(members.id, existing.id));
      }
    },
    catch: (cause) =>
      new WebhookSyncError({ message: "Failed to upsert membership", cause }),
  });
});

export const removeMembershipFromWebhook = Effect.fn(
  "auth.webhook.removeMembership"
)(function* (membership: OrganizationMembership) {
  const { organizationId, userId } = yield* resolveLocalIds(membership);

  if (!(organizationId && userId)) {
    return;
  }

  yield* Effect.tryPromise({
    try: () =>
      db
        .delete(members)
        .where(
          and(
            eq(members.userId, userId),
            eq(members.organizationId, organizationId)
          )
        ),
    catch: (cause) =>
      new WebhookSyncError({ message: "Failed to remove membership", cause }),
  });
});
