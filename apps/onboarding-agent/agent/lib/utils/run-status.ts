import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { getOrganizationId } from "@notra/tools/utils/organization";
import { withTransientRetryEffect } from "@notra/tools/utils/retry";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import type { SessionContext } from "eve/context";

function getReservationDate(ctx: SessionContext): Date | null {
  const value =
    ctx.session.auth.current?.attributes.reservedAt ??
    ctx.session.auth.initiator?.attributes.reservedAt;
  if (typeof value !== "string") {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

export async function markOnboardingAgentRan(
  ctx: SessionContext
): Promise<void> {
  const organizationId = getOrganizationId(ctx);
  const reservedAt = getReservationDate(ctx);
  if (!(organizationId && reservedAt)) {
    return;
  }
  await withTransientRetryEffect(
    async () => {
      await db
        .update(organizations)
        .set({
          onboardingAgentRan: true,
          onboardingAgentStartedAt: null,
        })
        .where(
          and(
            eq(organizations.id, organizationId),
            eq(organizations.onboardingAgentRan, false),
            eq(organizations.onboardingAgentStartedAt, reservedAt)
          )
        );
    },
    { operationName: `Mark onboarding agent ran for ${organizationId}` }
  ).pipe(
    Effect.catchTag("ToolOperationError", (error) =>
      Effect.logError(
        `[run-status] Failed to mark onboarding agent ran for organization ${organizationId}`,
        error.cause
      )
    ),
    Effect.runPromise
  );
}
