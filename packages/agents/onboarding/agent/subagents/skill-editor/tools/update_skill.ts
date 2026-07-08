import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { requireOrganizationId } from "../../../lib/utils/organization";

export default defineTool({
  description:
    "Update a skill's content and/or description for the organization. Requires at least one field to change.",
  inputSchema: z
    .object({
      name: z.string().min(1),
      content: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
    })
    .refine(
      (input) => input.content !== undefined || input.description !== undefined,
      {
        message: "Provide content or description to update",
      }
    ),
  async execute({ name, content, description }, ctx) {
    const organizationId = requireOrganizationId(ctx);
    const updated = await db
      .update(skills)
      .set({
        ...(content !== undefined ? { content } : {}),
        ...(description !== undefined ? { description } : {}),
      })
      .where(
        and(eq(skills.organizationId, organizationId), eq(skills.name, name))
      )
      .returning({ name: skills.name });

    const row = updated[0];
    if (!row) {
      throw new Error(
        `Skill "${name}" was not updated: it does not exist for this organization`
      );
    }

    return {
      name: row.name,
      updatedFields: [
        ...(content !== undefined ? ["content"] : []),
        ...(description !== undefined ? ["description"] : []),
      ],
    };
  },
});
