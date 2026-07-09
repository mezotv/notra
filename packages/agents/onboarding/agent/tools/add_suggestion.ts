import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import { onboardingSuggestions, organizations } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { addSuggestionInputSchema } from "../lib/schemas/onboarding-tools";
import { requireOrganizationId } from "../lib/utils/organization";

export default defineTool({
  description:
    "Add one onboarding suggestion for the organization, typed by the automation page it belongs to: event_automation for event-triggered content (for example: they publish GitHub releases, so suggest changelog posts on release) or schedule_automation for recurring content (for example: they blog weekly, so suggest a weekly schedule). Only suggest what the research evidence supports; put the specific supporting finding in evidence.",
  inputSchema: addSuggestionInputSchema,
  async execute({ type, title, description, evidence, data }, ctx) {
    const organizationId = requireOrganizationId(ctx);
    const payload = { ...data, ...(evidence ? { evidence } : {}) };
    return db.transaction(async (tx) => {
      const [organization] = await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1)
        .for("update");
      if (!organization) {
        throw new Error("Organization was not found");
      }

      const existing = await tx.query.onboardingSuggestions.findFirst({
        columns: { id: true },
        where: and(
          eq(onboardingSuggestions.organizationId, organizationId),
          eq(onboardingSuggestions.type, type),
          eq(onboardingSuggestions.title, title)
        ),
      });
      if (existing) {
        return { id: existing.id, skipped: true, title, type };
      }

      const inserted = await tx
        .insert(onboardingSuggestions)
        .values({
          data: Object.keys(payload).length > 0 ? payload : null,
          description: description ?? null,
          id: randomUUID(),
          organizationId,
          title,
          type,
        })
        .returning({ id: onboardingSuggestions.id });

      const row = inserted[0];
      if (!row) {
        throw new Error("Onboarding suggestion insert returned no row");
      }

      return { id: row.id, skipped: false, title, type };
    });
  },
});
