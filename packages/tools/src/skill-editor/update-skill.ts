import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";

import { updateSkillInputSchema } from "../schemas/skill-tools";
import { requireOrganizationId } from "../utils/organization";

export function createUpdateSkillTool() {
  return defineTool({
    description:
      "Update a skill's content and/or description for the organization. Requires at least one field to change.",
    inputSchema: updateSkillInputSchema,
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
}
