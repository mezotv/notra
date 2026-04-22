import { db } from "@notra/db/drizzle";
import { skills } from "@notra/db/schema";
import { type Tool, tool } from "ai";
import { and, count, eq } from "drizzle-orm";
import z from "zod";

export interface SkillsToolContext {
  organizationId: string;
}

export function listAvailableSkills(ctx: SkillsToolContext): Tool {
  return tool({
    description:
      "List available writing skills for this organization. Returns name and description for each. Call getSkillByName to load a skill's full content.",
    inputSchema: z.object({
      limit: z.number().default(20).describe("The number of skills to list"),
      offset: z
        .number()
        .default(0)
        .describe("The offset to start listing skills from"),
    }),
    execute: async ({ limit, offset }) => {
      const [rows, totalResult] = await Promise.all([
        db
          .select({
            name: skills.name,
            description: skills.description,
            isSystem: skills.isSystem,
          })
          .from(skills)
          .where(eq(skills.organizationId, ctx.organizationId))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(skills)
          .where(eq(skills.organizationId, ctx.organizationId)),
      ]);

      return {
        skills: rows.map((row) => ({
          name: row.name,
          description: row.description,
          isSystem: row.isSystem,
        })),
        total: totalResult[0]?.total ?? 0,
      };
    },
  });
}

export function getSkillByName(ctx: SkillsToolContext): Tool {
  return tool({
    description:
      "Load a skill's full content by name. Returns name, description, and the skill body. Call listAvailableSkills first to discover available names.",
    inputSchema: z.object({
      name: z.string().describe("The name of the skill to load."),
    }),
    execute: async ({ name }) => {
      const row = await db.query.skills.findFirst({
        where: and(
          eq(skills.organizationId, ctx.organizationId),
          eq(skills.name, name)
        ),
      });

      if (!row) {
        return {
          error: `Skill "${name}" not found. Use listAvailableSkills to see available skills.`,
        };
      }

      return {
        name: row.name,
        description: row.description,
        content: row.content.trim(),
      };
    },
  });
}
