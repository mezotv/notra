import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export default defineTool({
  description:
    "Read the full content of one of the organization's skills by name.",
  inputSchema: z.object({
    organizationId: z.string().min(1),
    name: z.string().min(1),
  }),
  async execute({ organizationId, name }) {
    const rows = await db
      .select({
        name: skills.name,
        description: skills.description,
        content: skills.content,
        isSystem: skills.isSystem,
      })
      .from(skills)
      .where(
        and(eq(skills.organizationId, organizationId), eq(skills.name, name))
      )
      .limit(1);

    const skill = rows[0];
    if (!skill) {
      throw new Error(`Skill "${name}" was not found for this organization`);
    }
    return skill;
  },
});
