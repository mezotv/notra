import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  onboardingSuggestions,
  onboardingSuggestionTypeEnum,
} from "@notra/db/schema";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { requireOrganizationId } from "../lib/utils/organization";

export default defineTool({
  description:
    "Add one onboarding suggestion for the organization, typed by the automation page it belongs to: event_automation for event-triggered content (for example: they publish GitHub releases, so suggest changelog posts on release) or schedule_automation for recurring content (for example: they blog weekly, so suggest a weekly schedule). Only suggest what the research evidence supports; put the specific supporting finding in evidence.",
  inputSchema: z.object({
    type: z.enum(onboardingSuggestionTypeEnum.enumValues),
    title: z.string().min(1),
    description: z.string().min(1).optional(),
    evidence: z.string().min(1).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
  async execute({ type, title, description, evidence, data }, ctx) {
    const organizationId = requireOrganizationId(ctx);
    const payload = { ...data, ...(evidence ? { evidence } : {}) };
    const inserted = await db
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

    return { id: row.id, title, type };
  },
});
