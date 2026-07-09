import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";

const ORGANIZATION_ID_PATTERN = /The organizationId is ([A-Za-z0-9_-]+)\./;

const sessionOrganizations = new Map<string, string>();

export function rememberSessionOrganization(
  sessionId: string,
  message: string
): void {
  const match = ORGANIZATION_ID_PATTERN.exec(message);
  const organizationId = match?.[1];
  if (organizationId) {
    sessionOrganizations.set(sessionId, organizationId);
  }
}

export function forgetSessionOrganization(sessionId: string): void {
  sessionOrganizations.delete(sessionId);
}

export async function markOnboardingAgentRan(sessionId: string): Promise<void> {
  const organizationId = sessionOrganizations.get(sessionId);
  if (!organizationId) {
    return;
  }
  try {
    await db
      .update(organizations)
      .set({ onboardingAgentRan: true })
      .where(eq(organizations.id, organizationId));
    sessionOrganizations.delete(sessionId);
  } catch (error) {
    console.error(
      `[run-status] Failed to mark onboarding agent ran for organization ${organizationId}`,
      error
    );
  }
}
