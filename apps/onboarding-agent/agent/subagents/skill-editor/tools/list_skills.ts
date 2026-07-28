import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { asc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { listSkillsInputSchema } from "../../../lib/schemas/skill-tools";
import { requireOrganizationId } from "../../../lib/utils/organization";

export default defineTool({
  description:
    "List the organization's content skills: name, description, and whether they are system-owned.",
  inputSchema: listSkillsInputSchema,
  async execute(_input, ctx) {
    const organizationId = requireOrganizationId(ctx);
    const rows = await db
      .select({
        name: skills.name,
        description: skills.description,
        isSystem: skills.isSystem,
      })
      .from(skills)
      .where(eq(skills.organizationId, organizationId))
      .orderBy(asc(skills.name));

    return { skills: rows };
  },
});
