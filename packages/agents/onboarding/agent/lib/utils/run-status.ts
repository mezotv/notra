import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import type { SessionContext } from "eve/context";
import { getOrganizationId } from "./organization";
import { withTransientRetryEffect } from "./retry";

export async function markOnboardingAgentRan(
  ctx: SessionContext
): Promise<void> {
  const organizationId = getOrganizationId(ctx);
  if (!organizationId) {
    return;
  }
  await withTransientRetryEffect(
    async () => {
      await db
        .update(organizations)
        .set({ onboardingAgentRan: true })
        .where(eq(organizations.id, organizationId));
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
