import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { asc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";

export default defineTool({
  description:
    "List an organization's content skills: name, description, and whether they are system-owned.",
  inputSchema: z.object({
    organizationId: z.string().min(1),
  }),
  async execute({ organizationId }) {
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
